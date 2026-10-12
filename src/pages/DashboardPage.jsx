import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import { useOperationsUrlState } from '../hooks/useOperationsUrlState.js';
import { useDebounce } from '../hooks/useDebounce.js';
import {
  useOperationsQuery,
  useOperationDetailsQuery,
  useOperationStatsQuery,
  useUpdateOperationStatusMutation,
} from '../hooks/useOperations.js';
import {
  setGlobalFailureSimulation,
  getGlobalFailureSimulation,
} from '../api/operationsApi.js';

import { Header } from '../components/Header.jsx';
import { SummaryCards } from '../components/SummaryCards.jsx';
import { FilterBar } from '../components/FilterBar.jsx';
import { OperationsTable } from '../components/OperationsTable.jsx';
import { Pagination } from '../components/Pagination.jsx';
import { Toast } from '../components/Toast.jsx';

const OperationDetailsDrawer = lazy(() => import('../components/OperationDetailsDrawer.jsx').then((module) => ({
  default: module.OperationDetailsDrawer,
})));

export function DashboardPage() {
  const urlState = useOperationsUrlState();

  // Local state for instant input responsiveness before debounce
  const [searchInput, setSearchInput] = useState(urlState.search);
  const [prevUrlSearch, setPrevUrlSearch] = useState(urlState.search);

  // Synchronize searchInput when urlState.search changes externally (recommended React pattern)
  if (urlState.search !== prevUrlSearch) {
    setPrevUrlSearch(urlState.search);
    setSearchInput(urlState.search);
  }

  const debouncedSearch = useDebounce(searchInput, 300);

  // Failure simulation toggle
  const [simulateFailure, setSimulateFailureState] = useState(getGlobalFailureSimulation());

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = useCallback(({ type, title, message }) => {
    setToast({ type, title, message });
  }, []);

  const clearToast = useCallback(() => {
    setToast(null);
  }, []);

  // Synchronize debounced search with URL state
  useEffect(() => {
    if (debouncedSearch !== urlState.search) {
      urlState.setSearch(debouncedSearch);
    }
  }, [debouncedSearch, urlState]);

  // Query: Operations List
  const {
    data: operationsData,
    isLoading: isOperationsLoading,
    isFetching: isOperationsFetching,
    isError: isOperationsError,
    error: operationsError,
    refetch: refetchOperations,
  } = useOperationsQuery({
    search: urlState.search,
    status: urlState.status,
    sortBy: urlState.sortBy,
    sortOrder: urlState.sortOrder,
    page: urlState.page,
    pageSize: urlState.pageSize,
  });

  // Query: Operation Statistics
  const {
    data: statsData,
    isLoading: isStatsLoading,
    refetch: refetchStats,
  } = useOperationStatsQuery();

  // Query: Single Operation Details (for Drawer)
  const {
    data: selectedOperation,
    isLoading: isDetailsLoading,
    isError: isDetailsError,
    error: detailsError,
    refetch: refetchDetails,
  } = useOperationDetailsQuery(urlState.selectedId);

  // Mutation: Status Update
  const updateStatusMutation = useUpdateOperationStatusMutation({
    onToast: showToast,
  });

  // Toggle failure simulation
  const handleToggleSimulateFailure = () => {
    const nextVal = !simulateFailure;
    setSimulateFailureState(nextVal);
    setGlobalFailureSimulation(nextVal);
    showToast({
      type: nextVal ? 'info' : 'success',
      title: nextVal ? 'Failure Simulation Activated' : 'Normal Operations Restored',
      message: nextVal
        ? 'Backend API calls will now intermittently fail (35% probability) to test error handling and retries.'
        : 'All mock backend operations will now execute reliably without simulated network errors.',
    });
  };

  // Manual refresh
  const handleRefresh = async () => {
    await Promise.all([refetchOperations(), refetchStats()]);
    showToast({
      type: 'info',
      title: 'Fleet Refreshed',
      message: 'Successfully re-synchronized telemetry with operations backend.',
    });
  };

  // Handle Quick Status Change from table or drawer
  const handleUpdateStatus = ({ id, status, note, simulateFailure: reqFailure }) => {
    updateStatusMutation.mutate({
      id,
      status,
      note,
      simulateFailure: reqFailure,
    });
  };

  const handleResetFilters = () => {
    setSearchInput('');
    urlState.resetAllFilters();
  };

  const handleSelectSummaryStatus = (clickedStatus) => {
    if (clickedStatus === 'All' || urlState.status === clickedStatus) {
      urlState.setStatus('All');
    } else {
      urlState.setStatus(clickedStatus);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      {/* Top Header */}
      <Header
        isRefetching={isOperationsFetching}
        onRefresh={handleRefresh}
        simulateFailure={simulateFailure}
        failureProbability={0.35}
        onToggleSimulateFailure={handleToggleSimulateFailure}
      />

      {/* Main Content Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Section 1: Overview Summary Cards */}
        <SummaryCards
          stats={statsData}
          isLoading={isStatsLoading}
          selectedStatus={urlState.status}
          onSelectStatus={handleSelectSummaryStatus}
        />

        {/* Section 2: Filters, Search & Sorting Controls */}
        <FilterBar
          search={searchInput}
          onSearchChange={setSearchInput}
          status={urlState.status}
          onStatusChange={urlState.setStatus}
          sortBy={urlState.sortBy}
          sortOrder={urlState.sortOrder}
          onSortChange={urlState.setSorting}
          pageSize={urlState.pageSize}
          onPageSizeChange={urlState.setPageSize}
          onResetFilters={handleResetFilters}
          isFetching={isOperationsFetching}
        />

        {/* Section 3: Operations Data Table */}
        <OperationsTable
          operations={operationsData?.data || []}
          isLoading={isOperationsLoading}
          isError={isOperationsError}
          error={operationsError}
          onRetry={refetchOperations}
          onSelectOperation={urlState.setSelectedId}
          sortBy={urlState.sortBy}
          sortOrder={urlState.sortOrder}
          onSortChange={urlState.setSorting}
          onQuickStatusChange={(id, status) => handleUpdateStatus({ id, status })}
          onResetFilters={handleResetFilters}
        />

        {/* Section 4: Pagination Controls */}
        <Pagination
          page={urlState.page}
          pageSize={urlState.pageSize}
          totalRecords={operationsData?.totalRecords || 0}
          totalPages={operationsData?.totalPages || 1}
          onPageChange={urlState.setPage}
        />
      </main>

      {/* Enterprise Footer */}
      <footer className="border-t border-slate-200/80 bg-white/70 backdrop-blur-xs py-4 px-4 sm:px-6 lg:px-8 mt-auto text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="font-semibold text-slate-700">Fleet Telemetry Operational</span>
            <span className="text-slate-300">•</span>
            <span>Version 2.4.0</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>Synchronized via React Query</span>
            <span>Client-side URL state synchronization</span>
          </div>
        </div>
      </footer>

      {/* Operation Details Drawer */}
      {urlState.selectedId && (
        <Suspense fallback={null}>
          <OperationDetailsDrawer
            operationId={urlState.selectedId}
            isOpen
            onClose={() => urlState.setSelectedId(null)}
            operation={selectedOperation}
            isLoading={isDetailsLoading}
            isError={isDetailsError}
            error={detailsError}
            onRetry={refetchDetails}
            onUpdateStatus={handleUpdateStatus}
            isUpdating={updateStatusMutation.isPending}
          />
        </Suspense>
      )}

      {/* Toast Feedback Notification */}
      <Toast toast={toast} onClose={clearToast} />
    </div>
  );
}
