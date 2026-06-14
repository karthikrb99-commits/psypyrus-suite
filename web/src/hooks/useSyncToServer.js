/**
 * useSyncToServer — React hook
 *
 * Automatically syncs local PsyPyrus data to the sync-service backend
 * whenever a Firebase user is signed in.
 *
 * Features:
 * - Auto-triggers sync on sign-in and on demand
 * - Exposes { isSyncing, lastSyncAt, syncError, triggerSync }
 * - Debounced / periodic background sync every 5 minutes
 *
 * Usage:
 *   const { isSyncing, lastSyncAt, syncError, triggerSync } = useSyncToServer(firebaseUser);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Database } from '../services/db';

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function useSyncToServer(firebaseUser) {
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncAt, setLastSyncAt] = useState(() => {
        const stored = localStorage.getItem('psypyrus_last_sync');
        return stored ? new Date(stored) : null;
    });
    const [syncError, setSyncError] = useState(null);
    const intervalRef = useRef(null);

    const triggerSync = useCallback(async () => {
        if (!firebaseUser) {
            setSyncError('Not signed in — sync requires Firebase authentication.');
            return;
        }

        setIsSyncing(true);
        setSyncError(null);

        try {
            // Get the fresh Firebase ID token
            const idToken = await firebaseUser.getIdToken(/* forceRefresh */ false);

            const result = await Database.syncToServer(idToken);

            const now = new Date();
            setLastSyncAt(now);
            localStorage.setItem('psypyrus_last_sync', now.toISOString());

            console.info('[useSyncToServer] Sync completed:', {
                serverTimestamp: result.server_timestamp,
                accepted: result.accepted,
                conflicts: result.conflicts,
            });

            return result;
        } catch (err) {
            console.error('[useSyncToServer] Sync failed:', err.message);
            setSyncError(err.message);
            throw err;
        } finally {
            setIsSyncing(false);
        }
    }, [firebaseUser]);

    // Auto-sync on sign-in
    useEffect(() => {
        if (!firebaseUser) {
            // Clear interval when signed out
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Trigger an immediate sync on sign-in (with a small delay to let state settle)
        const timeout = setTimeout(() => {
            triggerSync().catch(() => {
                // Errors are already captured in syncError state — suppress unhandled rejection
            });
        }, 2000);

        // Set up periodic background sync
        intervalRef.current = setInterval(() => {
            triggerSync().catch(() => {});
        }, SYNC_INTERVAL_MS);

        return () => {
            clearTimeout(timeout);
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [firebaseUser, triggerSync]);

    return {
        isSyncing,
        lastSyncAt,
        syncError,
        triggerSync,
    };
}
