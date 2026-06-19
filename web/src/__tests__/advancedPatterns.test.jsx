/**
 * PsyPyrus Advanced Distributed Systems Patterns — Unit Test Suite
 * Tests: Logger, Tracer, Circuit Breaker, Saga Pattern, Distributed Locks,
 *        Consistent Hashing, and Bulkhead Isolation
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Database } from '../services/db';
import { Logger } from '../services/logger';
import { Tracer } from '../services/tracer';

// ─── Test Setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
    // Reset localStorage for a clean slate
    localStorage.clear();
    // Reset all static state
    Database.init();
    Database.circuitBreaker.reset();
    Database._distributedLocks.clear();
    Database.distributedLockLogs = [];
    Database.sagaLogs = [];
    Logger.clearLogs();
    Tracer.clearTraces();
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. LOGGER SERVICE TESTS
// ─────────────────────────────────────────────────────────────────────────────
describe('PsyPyrus Advanced Patterns — Phase 2 System Design Tests', () => {

    describe('1. Logger Service', () => {
        it('should log messages at all levels and buffer them', () => {
            Logger.info('test-service', 'TEST_INFO', 'Info message', { key: 'val' });
            Logger.warn('test-service', 'TEST_WARN', 'Warning message', {});
            Logger.error('test-service', 'TEST_ERROR', 'Error message', { code: 500 });
            Logger.debug('test-service', 'TEST_DEBUG', 'Debug message', {});

            const logs = Logger.getLogs();
            expect(logs).toHaveLength(4);
            expect(logs[0].level).toBe('INFO');
            expect(logs[1].level).toBe('WARN');
            expect(logs[2].level).toBe('ERROR');
            expect(logs[3].level).toBe('DEBUG');
        });

        it('should store correct structured fields on each log entry', () => {
            Logger.info('database-service', 'DB_READ', 'Read patient records', { count: 5 });
            const logs = Logger.getLogs();
            const entry = logs[0];

            expect(entry.service).toBe('database-service');
            expect(entry.event).toBe('DB_READ');
            expect(entry.message).toBe('Read patient records');
            expect(entry.metadata).toEqual({ count: 5 });
            expect(entry.timestamp).toBeTruthy();
        });

        it('should cap the buffer at maxBufferLength (100) entries', () => {
            for (let i = 0; i < 110; i++) {
                Logger.info('svc', 'EVT', `Log entry ${i}`, {});
            }
            const logs = Logger.getLogs();
            expect(logs.length).toBeLessThanOrEqual(100);
        });

        it('should clear the log buffer on clearLogs()', () => {
            Logger.info('svc', 'EVT', 'Before clear', {});
            Logger.clearLogs();
            expect(Logger.getLogs()).toHaveLength(0);
        });

        it('should dispatch psypyrus_log window event on each log', () => {
            const handler = vi.fn();
            window.addEventListener('psypyrus_log', handler);
            Logger.info('svc', 'EVT', 'Event test', {});
            window.removeEventListener('psypyrus_log', handler);
            expect(handler).toHaveBeenCalledOnce();
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 2. TRACER SERVICE TESTS
    // ─────────────────────────────────────────────────────────────────────────
    describe('2. Tracer Service', () => {
        it('should start and end a root span, recording duration', () => {
            const span = Tracer.startSpan('dbQuery', null, { table: 'patients' });
            expect(span.name).toBe('dbQuery');
            expect(span.isCompleted).toBe(false);
            expect(span.parentSpanId).toBeNull();

            const completed = Tracer.endSpan(span.spanId);
            expect(completed.isCompleted).toBe(true);
            expect(completed.durationMs).toBeGreaterThanOrEqual(0);
        });

        it('should record root spans into completedTraces', () => {
            const span = Tracer.startSpan('txOperation');
            Tracer.endSpan(span.spanId);
            const traces = Tracer.getCompletedTraces();
            expect(traces).toHaveLength(1);
            expect(traces[0].name).toBe('txOperation');
        });

        it('should support parent-child span nesting via traceId linkage', () => {
            const parent = Tracer.startSpan('parentOp');
            const child = Tracer.startSpan('childOp', parent, { step: 1 });

            expect(child.traceId).toBe(parent.traceId);
            expect(child.parentSpanId).toBe(parent.spanId);

            Tracer.endSpan(parent.spanId);
            Tracer.endSpan(child.spanId);

            const traces = Tracer.getCompletedTraces();
            const rootTrace = traces.find(t => t.traceId === parent.traceId);
            expect(rootTrace).toBeTruthy();
        });

        it('should mark spans as errored when endSpan is called with error=true', () => {
            const span = Tracer.startSpan('failingOp');
            const completed = Tracer.endSpan(span.spanId, true, 'Something went wrong');
            expect(completed.tags.error).toBe(true);
            expect(completed.tags.errorMessage).toBe('Something went wrong');
        });

        it('should clear all completed traces on clearTraces()', () => {
            const span = Tracer.startSpan('op');
            Tracer.endSpan(span.spanId);
            Tracer.clearTraces();
            expect(Tracer.getCompletedTraces()).toHaveLength(0);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 3. CIRCUIT BREAKER STATE MACHINE TESTS
    // ─────────────────────────────────────────────────────────────────────────
    describe('3. Circuit Breaker', () => {
        it('should start in CLOSED state and allow calls', () => {
            expect(Database.circuitBreaker.state).toBe('CLOSED');
            expect(Database.circuitBreaker.isCallPermitted()).toBe(true);
        });

        it('should transition to OPEN after failureThreshold consecutive failures', () => {
            for (let i = 0; i < Database.circuitBreaker.failureThreshold; i++) {
                Database.circuitBreaker.recordFailure();
            }
            expect(Database.circuitBreaker.state).toBe('OPEN');
        });

        it('should reject calls when circuit is OPEN', () => {
            for (let i = 0; i < Database.circuitBreaker.failureThreshold; i++) {
                Database.circuitBreaker.recordFailure();
            }
            expect(Database.circuitBreaker.state).toBe('OPEN');
            expect(Database.circuitBreaker.isCallPermitted()).toBe(false);
        });

        it('should transition OPEN → HALF_OPEN after recovery timeout', () => {
            for (let i = 0; i < Database.circuitBreaker.failureThreshold; i++) {
                Database.circuitBreaker.recordFailure();
            }
            // Fake the openedAt timestamp to be past the timeout
            Database.circuitBreaker.openedAt = Date.now() - Database.circuitBreaker.recoveryTimeoutMs - 1000;
            const permitted = Database.circuitBreaker.isCallPermitted();
            expect(permitted).toBe(true);
            expect(Database.circuitBreaker.state).toBe('HALF_OPEN');
        });

        it('should transition HALF_OPEN → CLOSED after successThreshold successes', () => {
            Database.circuitBreaker._transition('HALF_OPEN');
            for (let i = 0; i < Database.circuitBreaker.successThreshold; i++) {
                Database.circuitBreaker.recordSuccess();
            }
            expect(Database.circuitBreaker.state).toBe('CLOSED');
        });

        it('circuitCall() should throw when circuit is OPEN', async () => {
            for (let i = 0; i < Database.circuitBreaker.failureThreshold; i++) {
                Database.circuitBreaker.recordFailure();
            }
            await expect(Database.circuitCall(() => Promise.resolve('ok'))).rejects.toThrow('CircuitBreakerOpenException');
        });

        it('circuitCall() should record success on successful calls', async () => {
            Database.circuitBreaker.failureCount = 3;
            await Database.circuitCall(() => Promise.resolve('result'));
            expect(Database.circuitBreaker.failureCount).toBe(0);
        });

        it('circuitCall() should record failure and propagate error', async () => {
            await expect(
                Database.circuitCall(() => Promise.reject(new Error('network timeout')))
            ).rejects.toThrow('network timeout');
            expect(Database.circuitBreaker.failureCount).toBe(1);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 4. SAGA PATTERN TESTS
    // ─────────────────────────────────────────────────────────────────────────
    describe('4. Saga Pattern', () => {
        it('should commit all steps when all execute successfully', async () => {
            const executed = [];
            const steps = [
                { name: 'Step-1', execute: async () => { executed.push('Step-1'); }, compensate: async () => { executed.push('Compensate-1'); } },
                { name: 'Step-2', execute: async () => { executed.push('Step-2'); }, compensate: async () => { executed.push('Compensate-2'); } },
                { name: 'Step-3', execute: async () => { executed.push('Step-3'); }, compensate: async () => { executed.push('Compensate-3'); } }
            ];

            const result = await Database.runSaga(steps, 'Test Saga');
            expect(result.status).toBe('committed');
            expect(executed).toEqual(['Step-1', 'Step-2', 'Step-3']);
        });

        it('should compensate completed steps in reverse order when a step fails', async () => {
            const executed = [];
            const steps = [
                { name: 'Step-1', execute: async () => { executed.push('exec:1'); }, compensate: async () => { executed.push('comp:1'); } },
                { name: 'Step-2', execute: async () => { executed.push('exec:2'); }, compensate: async () => { executed.push('comp:2'); } },
                { name: 'Step-3', execute: async () => { throw new Error('Service unavailable'); }, compensate: async () => { executed.push('comp:3'); } }
            ];

            await expect(Database.runSaga(steps, 'Failing Saga')).rejects.toThrow('SagaAbortedException');
            // Step-3 never completed, so compensation runs for Step-2 then Step-1
            expect(executed).toEqual(['exec:1', 'exec:2', 'comp:2', 'comp:1']);
        });

        it('should log the saga with failed status when it aborts', async () => {
            const steps = [
                { name: 'OK-Step', execute: async () => {}, compensate: async () => {} },
                { name: 'Fail-Step', execute: async () => { throw new Error('DB write failed'); }, compensate: async () => {} }
            ];

            try { await Database.runSaga(steps, 'Logged Failing Saga'); } catch {}
            const sagaLog = Database.sagaLogs[0];
            expect(sagaLog.name).toBe('Logged Failing Saga');
            expect(sagaLog.status).toBe('failed');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 5. DISTRIBUTED LOCK TESTS
    // ─────────────────────────────────────────────────────────────────────────
    describe('5. Distributed Locks', () => {
        it('should acquire a lock on a resource successfully', () => {
            const lock = Database.acquireDistributedLock('patient:1', 'dr-katherine');
            expect(lock).toBeTruthy();
            expect(lock.owner).toBe('dr-katherine');
        });

        it('should throw when attempting to acquire a lock already held', () => {
            Database.acquireDistributedLock('patient:2', 'dr-katherine');
            expect(() => {
                Database.acquireDistributedLock('patient:2', 'dr-smith');
            }).toThrow('DistributedLockException');
        });

        it('should allow the same owner to re-acquire their own lock (same owner)', () => {
            // Same owner can force re-acquire (treated as own lock — already owned)
            // Per spec: same resource + same owner just returns fresh lock entry
            Database.acquireDistributedLock('patient:3', 'dr-katherine');
            Database.releaseDistributedLock('patient:3', 'dr-katherine');
            // After release, re-acquire succeeds
            const lock2 = Database.acquireDistributedLock('patient:3', 'dr-katherine');
            expect(lock2.owner).toBe('dr-katherine');
        });

        it('should release a lock and allow a new owner to acquire it', () => {
            Database.acquireDistributedLock('record:99', 'owner-A');
            Database.releaseDistributedLock('record:99', 'owner-A');
            // Now owner-B can acquire
            const lock = Database.acquireDistributedLock('record:99', 'owner-B');
            expect(lock.owner).toBe('owner-B');
        });

        it('should prevent release by a non-owner', () => {
            Database.acquireDistributedLock('record:77', 'real-owner');
            const released = Database.releaseDistributedLock('record:77', 'intruder');
            expect(released).toBe(false);
            // Lock should still be held by real-owner
            expect(Database._distributedLocks.has('record:77')).toBe(true);
        });

        it('should list all currently held locks via getDistributedLocks()', () => {
            Database.acquireDistributedLock('res:A', 'user-1');
            Database.acquireDistributedLock('res:B', 'user-2');
            const locks = Database.getDistributedLocks();
            expect(Object.keys(locks)).toHaveLength(2);
            expect(locks['res:A'].owner).toBe('user-1');
            expect(locks['res:B'].owner).toBe('user-2');
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 6. CONSISTENT HASHING TESTS
    // ─────────────────────────────────────────────────────────────────────────
    describe('6. Consistent Hashing', () => {
        it('should build a hash ring with virtualNodeCount * nodes.length entries', () => {
            Database.hashRing.build();
            const expectedEntries = Database.hashRing.nodes.length * Database.hashRing.virtualNodeCount;
            expect(Database.hashRing.ring).toHaveLength(expectedEntries);
        });

        it('should return a valid node name for any key', () => {
            const node = Database.hashRing.getNode('patient:123');
            expect(Database.hashRing.nodes).toContain(node);
        });

        it('should consistently map the same key to the same node (deterministic)', () => {
            const n1 = Database.hashRing.getNode('appointment:42');
            const n2 = Database.hashRing.getNode('appointment:42');
            expect(n1).toBe(n2);
        });

        it('should distribute different keys across multiple nodes', () => {
            const assignments = new Set();
            for (let i = 0; i < 50; i++) {
                assignments.add(Database.hashRing.getNode(`key:${i}`));
            }
            // With 4 nodes, at least 2 should be hit across 50 keys
            expect(assignments.size).toBeGreaterThanOrEqual(2);
        });
    });

    // ─────────────────────────────────────────────────────────────────────────
    // 7. BULKHEAD ISOLATION TESTS
    // ─────────────────────────────────────────────────────────────────────────
    describe('7. Bulkhead Isolation', () => {
        beforeEach(() => {
            // Reset bulkhead pool state
            Database.bulkhead.readPool.active = 0;
            Database.bulkhead.readPool.queue = [];
            Database.bulkhead.writePool.active = 0;
            Database.bulkhead.writePool.queue = [];
        });

        it('should acquire and release from readPool without blocking', async () => {
            await Database.bulkhead.acquire('readPool');
            expect(Database.bulkhead.readPool.active).toBe(1);
            Database.bulkhead.release('readPool');
            expect(Database.bulkhead.readPool.active).toBe(0);
        });

        it('should keep read and write pools independent', async () => {
            await Database.bulkhead.acquire('readPool');
            await Database.bulkhead.acquire('writePool');
            const stats = Database.bulkhead.getStats();
            expect(stats.reads.active).toBe(1);
            expect(stats.writes.active).toBe(1);
        });

        it('should throw when writePool queue overflows its limit', async () => {
            // Fill up the writePool beyond max * 2 queue limit
            Database.bulkhead.writePool.active = Database.bulkhead.writePool.max;
            Database.bulkhead.writePool.queue = new Array(Database.bulkhead.writePool.max * 2).fill(() => {});

            await expect(Database.bulkhead.acquire('writePool')).rejects.toThrow('queue overflow');
        });
    });
});
