import { useState, useEffect, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { getPendingMembers, updateMemberSyncStatus } from '../services/database';
import { syncMembers } from '../services/api';

export const useSync = () => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const [pendingCount, setPendingCount] = useState(0);
    const [lastSyncTime, setLastSyncTime] = useState(null);

    // Monitor network status
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state) => {
            setIsOnline(state.isConnected && state.isInternetReachable);
        });

        return () => unsubscribe();
    }, []);

    // Update pending count
    const updatePendingCount = useCallback(async () => {
        const pending = await getPendingMembers();
        setPendingCount(pending.length);
    }, []);

    useEffect(() => {
        updatePendingCount();
    }, [updatePendingCount]);

    // Sync function
    const sync = useCallback(async () => {
        if (isSyncing) return { success: false, message: 'Sync already in progress' };
        if (!isOnline) return { success: false, message: 'No internet connection' };

        setIsSyncing(true);

        try {
            const pending = await getPendingMembers();

            if (pending.length === 0) {
                setIsSyncing(false);
                return { success: true, message: 'Nothing to sync' };
            }

            // Sync to server
            const result = await syncMembers(pending);

            // Update sync status for successful records
            for (const item of result.results.success) {
                await updateMemberSyncStatus(item.id, 'synced');
            }

            await updatePendingCount();
            setLastSyncTime(new Date());
            setIsSyncing(false);

            return {
                success: true,
                message: `Synced ${result.successful} of ${result.total} records`,
                details: result,
            };
        } catch (error) {
            setIsSyncing(false);
            console.error('Sync error:', error);
            return { success: false, message: 'Sync failed: ' + error.message };
        }
    }, [isSyncing, isOnline, updatePendingCount]);

    // Auto-sync when coming online
    useEffect(() => {
        if (isOnline && pendingCount > 0 && !isSyncing) {
            // Auto-sync immediately when online
            const timer = setTimeout(() => {
                sync();
            }, 500);

            return () => clearTimeout(timer);
        }
    }, [isOnline, pendingCount, isSyncing, sync]);

    return {
        sync,
        isSyncing,
        isOnline,
        pendingCount,
        lastSyncTime,
        updatePendingCount,
    };
};
