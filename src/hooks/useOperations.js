import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchOperations,
  fetchOperationById,
  fetchOperationStats,
  updateOperationStatus,
} from '../api/operationsApi.js';

export const OPERATIONS_QUERY_KEY = 'operations';
export const OPERATION_DETAILS_QUERY_KEY = 'operation';
export const OPERATION_STATS_QUERY_KEY = 'operation-stats';

/**
 * Hook to query paginated operations list with server-side filters.
 */
export function useOperationsQuery({
  search = '',
  status = 'All',
  sortBy = 'createdDate',
  sortOrder = 'desc',
  page = 1,
  pageSize = 10,
}) {
  return useQuery({
    queryKey: [OPERATIONS_QUERY_KEY, { search, status, sortBy, sortOrder, page, pageSize }],
    queryFn: ({ signal }) =>
      fetchOperations({
        search,
        status,
        sortBy,
        sortOrder,
        page,
        pageSize,
        signal,
      }),
    placeholderData: (previousData) => previousData,
    staleTime: 1000 * 30, // 30 seconds
  });
}

/**
 * Hook to query single operation details by ID.
 */
export function useOperationDetailsQuery(id) {
  return useQuery({
    queryKey: [OPERATION_DETAILS_QUERY_KEY, id],
    queryFn: ({ signal }) => fetchOperationById(id, { signal }),
    enabled: Boolean(id),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to query operation statistics summary.
 */
export function useOperationStatsQuery() {
  return useQuery({
    queryKey: [OPERATION_STATS_QUERY_KEY],
    queryFn: ({ signal }) => fetchOperationStats({ signal }),
    staleTime: 1000 * 30,
  });
}

/**
 * Hook to update an operation's status with optimistic updates and rollback.
 */
export function useUpdateOperationStatusMutation({ onToast } = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, note, simulateFailure }) =>
      updateOperationStatus({ id, status, note, simulateFailure }),

    onMutate: async ({ id, status }) => {
      // 1. Cancel any outgoing queries so they don't overwrite optimistic update
      await queryClient.cancelQueries({ queryKey: [OPERATIONS_QUERY_KEY] });
      await queryClient.cancelQueries({ queryKey: [OPERATION_DETAILS_QUERY_KEY, id] });
      await queryClient.cancelQueries({ queryKey: [OPERATION_STATS_QUERY_KEY] });

      // 2. Snapshot previous values for rollback
      const previousStats = queryClient.getQueryData([OPERATION_STATS_QUERY_KEY]);
      const previousDetails = queryClient.getQueryData([OPERATION_DETAILS_QUERY_KEY, id]);

      // Snapshot all matching list queries
      const operationsQueries = queryClient.getQueriesData({ queryKey: [OPERATIONS_QUERY_KEY] });

      // Find the old status from existing details or list queries
      let oldStatus = previousDetails?.status;
      if (!oldStatus) {
        for (const [, queryData] of operationsQueries) {
          const match = queryData?.data?.find((op) => op.id === id);
          if (match) {
            oldStatus = match.status;
            break;
          }
        }
      }

      const now = new Date().toISOString();

      // 3. Optimistically update Single Operation Details
      if (previousDetails) {
        queryClient.setQueryData([OPERATION_DETAILS_QUERY_KEY, id], (old) => {
          if (!old) return old;
          return {
            ...old,
            status,
            lastUpdatedDate: now,
            logs: [
              ...(old.logs || []),
              {
                id: `log-optimistic-${Date.now()}`,
                timestamp: now,
                level: status === 'Failed' ? 'ERROR' : status === 'Completed' ? 'SUCCESS' : 'INFO',
                message: `Status updated to ${status} (optimistic).`,
              },
            ],
          };
        });
      }

      // 4. Optimistically update each cached list. An item that no longer
      // matches a status-filtered query must disappear from that result set.
      operationsQueries.forEach(([queryKey, queryData]) => {
        if (!queryData?.data) return;

        const queryStatus = queryKey[1]?.status || 'All';
        const updatedRow = queryData.data.find((op) => op.id === id);
        if (!updatedRow) return;

        const noLongerMatchesStatus = queryStatus !== 'All'
          && queryStatus.toLowerCase() !== status.toLowerCase();
        const nextData = noLongerMatchesStatus
          ? queryData.data.filter((op) => op.id !== id)
          : queryData.data.map((op) => op.id === id
            ? { ...op, status, lastUpdatedDate: now }
            : op);

        queryClient.setQueryData(queryKey, {
          ...queryData,
          data: nextData,
          ...(noLongerMatchesStatus ? {
            totalRecords: Math.max(0, queryData.totalRecords - 1),
            totalPages: Math.max(1, Math.ceil(Math.max(0, queryData.totalRecords - 1) / queryData.pageSize)),
          } : {}),
        });
      });

      // 5. Optimistically update Statistics counts
      if (previousStats && oldStatus && oldStatus !== status) {
        queryClient.setQueryData([OPERATION_STATS_QUERY_KEY], (old) => {
          if (!old) return old;
          const next = { ...old };
          const oldKey = oldStatus.toLowerCase();
          const newKey = status.toLowerCase();

          if (typeof next[oldKey] === 'number') {
            next[oldKey] = Math.max(0, next[oldKey] - 1);
          }
          if (typeof next[newKey] === 'number') {
            next[newKey] = next[newKey] + 1;
          }
          return next;
        });
      }

      // Return context with snapshots for rollback in onError
      return {
        previousStats,
        previousDetails,
        operationsQueries,
        id,
      };
    },

    onError: (err, variables, context) => {
      // Rollback to previous snapshots
      if (context?.previousStats) {
        queryClient.setQueryData([OPERATION_STATS_QUERY_KEY], context.previousStats);
      }
      if (context?.previousDetails && context?.id) {
        queryClient.setQueryData([OPERATION_DETAILS_QUERY_KEY, context.id], context.previousDetails);
      }
      if (context?.operationsQueries) {
        context.operationsQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (onToast) {
        onToast({
          type: 'error',
          title: 'Status Update Failed',
          message: err?.message || 'Failed to update operation status. Rolled back changes.',
        });
      }
    },

    onSuccess: (data, variables) => {
      if (onToast) {
        onToast({
          type: 'success',
          title: 'Status Updated',
          message: `Operation ${variables.id} is now ${variables.status}.`,
        });
      }
    },

    onSettled: (data, error, variables) => {
      // Invalidate relevant queries to guarantee synchronization with backend
      queryClient.invalidateQueries({ queryKey: [OPERATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [OPERATION_STATS_QUERY_KEY] });
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: [OPERATION_DETAILS_QUERY_KEY, variables.id] });
      }
    },
  });
}
