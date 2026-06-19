import { describe, it, expect, beforeEach } from 'vitest';
import { Database } from '../services/db';

describe('PsyPyrus Distributed Systems & Database Optimization Tests', () => {
    beforeEach(() => {
        // Reset database state before each test
        Database.clearDatabase();
        Database.clearCache();
        Database.transactionLogs = [];
        Database.rateLimit.tokens = 15;
    });

    describe('1. Caching & Query Indexing', () => {
        it('should populate in-memory cache on read and track hits/misses', () => {
            const initialMisses = Database.cacheStats.misses;
            const initialHits = Database.cacheStats.hits;

            // First read should trigger a Cache Miss
            const patients1 = Database.getPatients();
            expect(patients1.length).toBeGreaterThan(0);
            expect(Database.cacheStats.misses).toBe(initialMisses + 1);

            // Second read should trigger a Cache Hit
            const patients2 = Database.getPatients();
            expect(patients2).toEqual(patients1);
            expect(Database.cacheStats.hits).toBe(initialHits + 1);
        });

        it('should invalidate cache on database write', () => {
            // Read to cache patient data
            Database.getPatients();
            const prevHits = Database.cacheStats.hits;

            // Perform write operation (should invalidate patient cache)
            Database.insertPatient({
                name: "Test Patient",
                age: 30,
                gender: "Female",
                riskStatus: "Low",
                specialty: "None"
            });

            // Read again - should result in cache miss, not a hit
            Database.getPatients();
            expect(Database.cacheStats.hits).toBe(prevHits); // No new hit, it missed!
        });

        it('should use Index Scan for patient-specific notes and Table Scan for all notes', () => {
            // Unindexed read should note Sequential Table Scan
            Database.getClinicalNotes();
            expect(Database.lastQueryPlan.strategy).toContain('Sequential Table Scan');

            // Indexed read by patientId should note Index Scan
            Database.getClinicalNotes(1);
            expect(Database.lastQueryPlan.strategy).toContain('Index Scan');
        });
    });

    describe('2. Connection Pooling & Rate Limiting', () => {
        it('should acquire and release connections in connection pool', async () => {
            expect(Database.connectionPool.activeConnections).toBe(0);
            
            await Database.connectionPool.acquire();
            expect(Database.connectionPool.activeConnections).toBe(1);
            
            Database.connectionPool.release();
            expect(Database.connectionPool.activeConnections).toBe(0);
        });

        it('should queue requests when connections are exhausted', async () => {
            // Occupy all 3 slots
            await Database.connectionPool.acquire();
            await Database.connectionPool.acquire();
            await Database.connectionPool.acquire();
            expect(Database.connectionPool.activeConnections).toBe(3);

            let queueResolved = false;
            // 4th acquire should block/queue
            Database.connectionPool.acquire().then(() => {
                queueResolved = true;
            });

            // Wait a brief tick
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(queueResolved).toBe(false); // Still waiting in queue

            // Release one connection slot
            Database.connectionPool.release();
            
            // Wait for queue microtasks
            await new Promise(resolve => setTimeout(resolve, 50));
            expect(queueResolved).toBe(true); // Resolved now!
            Database.connectionPool.release();
            Database.connectionPool.release();
            Database.connectionPool.release();
        });

        it('should enforce write rate limiting and reject when tokens empty', () => {
            Database.rateLimit.tokens = 0; // Empty the bucket
            expect(() => {
                Database.insertHomework({
                    patientId: 1,
                    description: "Write spammed task"
                });
            }).toThrow('rate limit exceeded');
        });
    });

    describe('3. ACID Transactions & Lock Mutex', () => {
        it('should commit changes successfully when transaction finishes without errors', () => {
            const initialCount = Database.getAppointments().length;
            
            Database.runInTransaction(() => {
                Database.insertAppointment({
                    patientId: 1,
                    patientName: "Liam Carter",
                    dateTime: "Today, 1:00 PM",
                    notes: "Atomic appointment test",
                    fee: 100,
                    isVideo: true
                });
            }, ['psypyrus_appointments']);

            expect(Database.getAppointments().length).toBe(initialCount + 1);
        });

        it('should rollback all transaction changes when callback throws exception', () => {
            const initialCount = Database.getAppointments().length;

            expect(() => {
                Database.runInTransaction(() => {
                    Database.insertAppointment({
                        patientId: 1,
                        patientName: "Liam Carter",
                        dateTime: "Today, 1:00 PM",
                        notes: "Atomic appointment test",
                        fee: 100,
                        isVideo: true
                    });
                    
                    // Throw validation exception to abort
                    throw new Error("Triggered transaction failure.");
                }, ['psypyrus_appointments']);
            }).toThrow();

            // Transaction should have rolled back, maintaining original count
            expect(Database.getAppointments().length).toBe(initialCount);
        });

        it('should reject write locks if table is already locked', () => {
            Database.acquireLock('psypyrus_patients');
            expect(() => {
                Database.acquireLock('psypyrus_patients');
            }).toThrow('locked');
            Database.releaseLock('psypyrus_patients');
        });
    });

    describe('4. Idempotency & Deduplication', () => {
        it('should process payment once and return cached response on retries with same key', () => {
            const key = "pay_consultation_test_key";
            const initialAppts = Database.getAppointments().length;

            // First execution
            const res1 = Database.insertAppointment({
                patientId: 1,
                patientName: "Liam Carter",
                dateTime: "Today, 2:00 PM",
                notes: "Initial payment swipe",
                fee: 150,
                isVideo: true
            }, key);

            expect(res1).toBeDefined();
            expect(Database.getAppointments().length).toBe(initialAppts + 1);

            // Duplicate retry execution (should deduplicate)
            const res2 = Database.insertAppointment({
                patientId: 1,
                patientName: "Liam Carter",
                dateTime: "Today, 2:00 PM",
                notes: "Initial payment swipe",
                fee: 150,
                isVideo: true
            }, key);

            expect(res2).toBe(res1);
            expect(Database.getAppointments().length).toBe(initialAppts + 1); // No double appointments added!
        });
    });

    describe('5. Message Queue & DLQ', () => {
        it('should enqueue and successfully process async background tasks', async () => {
            localStorage.setItem('psypyrus_force_sync_fail', 'false');
            
            const taskId = Database.enqueueTask('SYNC_EHR', { patientId: 1 });
            expect(taskId).toBeDefined();
            expect(Database.getQueue().length).toBe(1);

            // Let background queue runner process
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // Task should be successfully removed from active queue
            expect(Database.getQueue().length).toBe(0);
            expect(Database.getDLQ().length).toBe(0);
        });

        it('should retry failed tasks and route repeatedly failing tasks to DLQ', async () => {
            localStorage.setItem('psypyrus_force_sync_fail', 'true'); // Force sync failure
            
            Database.enqueueTask('SYNC_EHR', { patientId: 1 });
            
            // Wait for 3 retries with backoff delays
            await new Promise(resolve => setTimeout(resolve, 3500));
            
            // Task should fail 3 times and move to DLQ
            expect(Database.getQueue().length).toBe(0);
            expect(Database.getDLQ().length).toBe(1);
            expect(Database.getDLQ()[0].status).toBe('failed');
            expect(Database.getDLQ()[0].error).toContain('failed to acknowledge');
        });
    });
});
