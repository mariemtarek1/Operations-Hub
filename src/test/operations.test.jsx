import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

import { DashboardPage } from '../pages/DashboardPage.jsx';
import {
  resetMockDatabase,
  getOperationsStore,
} from '../api/mockData.js';
import * as operationsApi from '../api/operationsApi.js';

// Helper to render component with fresh QueryClient and MemoryRouter
function renderDashboard({ initialEntries = ['/'] } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={initialEntries}>
          <DashboardPage />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  };
}

describe('Operations Management Dashboard', () => {
  beforeEach(() => {
    resetMockDatabase();
    operationsApi.setGlobalFailureSimulation(false);
    operationsApi.setConfiguredLatency(0); // instant in tests
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Test 1: Rendering the operations dashboard
  it('1. renders the operations dashboard header, summary cards, and operations table', async () => {
    renderDashboard();

    // Verify Title
    expect(screen.getByRole('heading', { name: /Operations Management Dashboard/i })).toBeInTheDocument();

    // Verify Summary Cards
    expect(screen.getByTestId('stat-card-all')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-pending')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-running')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-completed')).toBeInTheDocument();
    expect(screen.getByTestId('stat-card-failed')).toBeInTheDocument();

    // Verify Search Input & Filters
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByTestId('status-filter-select')).toBeInTheDocument();

    // Verify Table loads items
    await waitFor(() => {
      const rows = screen.getAllByTestId(/^operation-row-OP-/);
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  // Test 2: Searching operations by name and ID
  it('2. searches operations by name and ID correctly', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const searchInput = screen.getByTestId('search-input');

    // Search by ID "OP-00042"
    await user.type(searchInput, 'OP-00042');

    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00042')).toBeInTheDocument();
    });

    // Clear search
    const clearBtn = screen.getByTestId('clear-search-btn');
    await user.click(clearBtn);

    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });

    // Search by specific name token, e.g. "PostgreSQL Cluster"
    await user.type(searchInput, 'PostgreSQL Cluster');

    await waitFor(() => {
      const rows = screen.getAllByTestId(/^operation-row-OP-/);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveTextContent(/PostgreSQL Cluster/i);
    });
  });

  // Test 3: Combining search with status filtering
  it('3. combines search query with status filtering', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const searchInput = screen.getByTestId('search-input');
    const statusSelect = screen.getByTestId('status-filter-select');

    // Filter by 'Failed' status
    await user.selectOptions(statusSelect, 'Failed');

    // Search for 'Cluster'
    await user.type(searchInput, 'Cluster');

    await waitFor(() => {
      const rows = screen.getAllByTestId(/^operation-row-OP-/);
      expect(rows.length).toBeGreaterThan(0);
      // Every visible row must have the Failed status badge
      rows.forEach((row) => {
        expect(within(row).getByTestId('status-badge-failed')).toBeInTheDocument();
        expect(row).toHaveTextContent(/Cluster/i);
      });
    });
  });

  // Test 4: Sorting and pagination
  it('4. supports sorting by created date and pagination with page navigation', async () => {
    const user = userEvent.setup();
    renderDashboard();

    // Verify first page has OP items
    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });

    // Sort order toggle: toggle to ascending
    const sortToggle = screen.getByTestId('sort-order-toggle');
    await user.click(sortToggle);

    await waitFor(() => {
      expect(sortToggle).toHaveTextContent(/Ascending/i);
    });

    // Go to next page
    const nextBtn = screen.getByTestId('next-page-btn');
    await user.click(nextBtn);

    await waitFor(() => {
      // Current active page should be 2
      const activePage = screen.getByTestId('page-btn-2');
      expect(activePage).toHaveAttribute('aria-current', 'page');
    });

    // Change page size to 25
    const pageSizeSelect = screen.getByTestId('page-size-select');
    await user.selectOptions(pageSizeSelect, '25');

    await waitFor(() => {
      const rows = screen.getAllByTestId(/^operation-row-OP-/);
      expect(rows.length).toBe(25);
    });
  });

  // Test 5: Correct status statistics
  it('5. computes and displays accurate status statistics for all 5,000+ operations', async () => {
    renderDashboard();

    const store = getOperationsStore();
    const expectedTotal = store.length;
    const expectedPending = store.filter((op) => op.status === 'Pending').length;
    const expectedRunning = store.filter((op) => op.status === 'Running').length;
    const expectedCompleted = store.filter((op) => op.status === 'Completed').length;
    const expectedFailed = store.filter((op) => op.status === 'Failed').length;

    await waitFor(() => {
      expect(screen.getByTestId('stat-count-all')).toHaveTextContent(expectedTotal.toLocaleString());
      expect(screen.getByTestId('stat-count-pending')).toHaveTextContent(expectedPending.toLocaleString());
      expect(screen.getByTestId('stat-count-running')).toHaveTextContent(expectedRunning.toLocaleString());
      expect(screen.getByTestId('stat-count-completed')).toHaveTextContent(expectedCompleted.toLocaleString());
      expect(screen.getByTestId('stat-count-failed')).toHaveTextContent(expectedFailed.toLocaleString());
    });
  });

  // Test 6: Updating an operation's status and refreshing displayed statistics
  it('6. updates an operation status and immediately synchronizes the statistics summary', async () => {
    const user = userEvent.setup();
    renderDashboard();

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });

    const store = getOperationsStore();
    const op1 = store.find((op) => op.id === 'OP-00001');
    const oldStatus = op1.status;
    const newStatus = oldStatus === 'Completed' ? 'Failed' : 'Completed';

    // Open Quick Status select on OP-00001 row
    const quickSelect = screen.getByTestId('quick-status-select-OP-00001');
    await user.selectOptions(quickSelect, newStatus);

    // Verify row has new status badge
    await waitFor(() => {
      expect(
        within(screen.getByTestId('operation-row-OP-00001')).getByTestId(
          `status-badge-${newStatus.toLowerCase()}`
        )
      ).toBeInTheDocument();
    });

    // Check that backend store was updated
    await waitFor(() => {
      const updatedOp = store.find((op) => op.id === 'OP-00001');
      expect(updatedOp.status).toBe(newStatus);
    });

    // Verify statistics summary card reflects updated count
    const expectedNewCount = store.filter((op) => op.status === newStatus).length;
    await waitFor(() => {
      expect(screen.getByTestId(`stat-count-${newStatus.toLowerCase()}`)).toHaveTextContent(
        expectedNewCount.toLocaleString()
      );
    });
  });

  // Test 7: Handling API failures and retry behavior
  it('7. displays error state when API fails and successfully retries upon clicking Retry', async () => {
    const user = userEvent.setup();

    // Enable failure simulation initially
    operationsApi.setGlobalFailureSimulation(true);

    renderDashboard();

    // Error state should display
    await waitFor(() => {
      expect(screen.getByText(/Failed to Load Operations/i)).toBeInTheDocument();
    });

    const retryBtn = screen.getByTestId('retry-btn');
    expect(retryBtn).toBeInTheDocument();

    // Disable failure simulation and click retry
    operationsApi.setGlobalFailureSimulation(false);
    await user.click(retryBtn);

    // Table should now load successfully
    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });
  });

  // Test 8: Out-of-order search responses
  it('8. handles out-of-order search responses so older delayed responses do not overwrite newer ones', async () => {
    const user = userEvent.setup();

    // We spy on fetchOperations to control resolution order
    let resolveFirstRequest;
    let resolveSecondRequest;

    const firstPromise = new Promise((resolve) => {
      resolveFirstRequest = resolve;
    });
    const secondPromise = new Promise((resolve) => {
      resolveSecondRequest = resolve;
    });

    const originalFetchOperations = operationsApi.fetchOperations;

    vi.spyOn(operationsApi, 'fetchOperations').mockImplementation((params) => {
      if (params.search === 'slow-query') {
        return firstPromise;
      }
      if (params.search === 'fast-query') {
        return secondPromise;
      }
      return originalFetchOperations(params);
    });

    renderDashboard();

    const searchInput = screen.getByTestId('search-input');

    // 1. Type "slow-query"
    await user.type(searchInput, 'slow-query');

    // 2. Clear and type "fast-query"
    await user.clear(searchInput);
    await user.type(searchInput, 'fast-query');

    // Resolve second (fast-query) FIRST with fast result
    resolveSecondRequest({
      data: [
        {
          id: 'OP-FAST-1',
          name: 'Fast Query Result',
          owner: 'Alex Rivera',
          status: 'Completed',
          createdDate: new Date().toISOString(),
          lastUpdatedDate: new Date().toISOString(),
          description: 'Fast query test item',
          priority: 'High',
        },
      ],
      totalRecords: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    await waitFor(() => {
      expect(screen.getByText('Fast Query Result')).toBeInTheDocument();
    }, { timeout: 4000 });

    // Now resolve first (slow-query) LATER with obsolete result
    resolveFirstRequest({
      data: [
        {
          id: 'OP-SLOW-1',
          name: 'Old Out-of-Order Result',
          owner: 'Slow Worker',
          status: 'Pending',
          createdDate: new Date().toISOString(),
          lastUpdatedDate: new Date().toISOString(),
          description: 'Obsolete item that finished late',
          priority: 'Low',
        },
      ],
      totalRecords: 1,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    });

    // Verify "Old Out-of-Order Result" does NOT overwrite the visible UI
    await waitFor(() => {
      expect(screen.getByText('Fast Query Result')).toBeInTheDocument();
      expect(screen.queryByText('Old Out-of-Order Result')).not.toBeInTheDocument();
    }, { timeout: 4000 });
  });

  // Test 9: Ensuring an older request cannot overwrite newer search results
  it('9. ensures an older aborted request does not overwrite newer search results', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const searchInput = screen.getByTestId('search-input');

    // Type query A
    await user.type(searchInput, 'OP-00001');
    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });

    // Quickly replace with query B
    await user.clear(searchInput);
    await user.type(searchInput, 'OP-00002');

    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00002')).toBeInTheDocument();
      expect(screen.queryByTestId('operation-row-OP-00001')).not.toBeInTheDocument();
    });
  });

  // Test 10: Ensuring stale results are not displayed after the search query changes
  it('10. ensures stale results are cleared or updated when search query changes to non-matching term', async () => {
    const user = userEvent.setup();
    renderDashboard();

    const searchInput = screen.getByTestId('search-input');

    // Type query that matches nothing
    await user.type(searchInput, 'NO_MATCH_XYZ');

    await waitFor(() => {
      expect(screen.getByText(/No Operations Found/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  // Test 11: Preserving list state when navigating between list and details
  it('11. preserves search, status, sorting, and pagination state when opening and closing details drawer', async () => {
    const user = userEvent.setup();
    renderDashboard({ initialEntries: ['/?status=Failed&page=2&pageSize=10'] });

    // Verify initial URL state is reflected
    await waitFor(() => {
      const activePage = screen.getByTestId('page-btn-2');
      expect(activePage).toHaveAttribute('aria-current', 'page');
    });

    // Open details drawer by clicking on the first visible row's view details button
    const firstRow = screen.getAllByTestId(/^operation-row-OP-/)[0];
    const detailsBtn = within(firstRow).getByRole('button', { name: /View details/i });
    await user.click(detailsBtn);

    // Verify drawer opened
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Operation Details Drawer/i })).toBeInTheDocument();
    });

    // Close drawer
    const closeBtn = screen.getByTestId('close-drawer-btn');
    await user.click(closeBtn);

    // Verify drawer is closed
    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: /Operation Details Drawer/i })).not.toBeInTheDocument();
    });

    // Verify list state was preserved (still on page 2, filter still Failed)
    expect(screen.getByTestId('page-btn-2')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('status-filter-select')).toHaveValue('Failed');
  });

  // Test 12: Handling failed optimistic updates and rolling back correctly
  it('12. handles failed optimistic status updates and rolls back correctly with error feedback', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });

    const store = getOperationsStore();
    const op1 = store.find((op) => op.id === 'OP-00001');
    const originalStatus = op1.status;
    const targetStatus = originalStatus === 'Completed' ? 'Failed' : 'Completed';

    // Click on row to open drawer
    await user.click(screen.getByTestId('operation-row-OP-00001'));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Operation Details Drawer/i })).toBeInTheDocument();
    });

    // In drawer, select target status
    const targetStatusOption = screen.getByTestId(`status-option-${targetStatus.toLowerCase()}`);
    await user.click(targetStatusOption);

    // Check "Simulate API failure on status update" checkbox
    const failureCheckbox = screen.getByRole('checkbox', {
      name: /Simulate API failure on status update/i,
    });
    await user.click(failureCheckbox);

    // Click Save Status button
    const saveBtn = screen.getByTestId('save-status-btn');
    await user.click(saveBtn);

    // Toast error alert should appear indicating rollback
    await waitFor(() => {
      expect(screen.getByText(/Status Update Failed/i)).toBeInTheDocument();
    });

    // Operation status should be rolled back to originalStatus in UI
    await waitFor(() => {
      expect(
        within(screen.getByTestId('operation-row-OP-00001')).getByTestId(
          `status-badge-${originalStatus.toLowerCase()}`
        )
      ).toBeInTheDocument();
    });
  });

  // Test 13: Successful operation details fetching
  it('13. successfully fetches operation details and displays operational metadata and telemetry logs', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });

    // Click row to view details
    await user.click(screen.getByTestId('operation-row-OP-00001'));

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /Operation Details Drawer/i })).toBeInTheDocument();
      expect(screen.getByText(/Operational Metadata/i)).toBeInTheDocument();
      expect(screen.getByText(/Execution Telemetry & Audit Logs/i)).toBeInTheDocument();
    });
  });

  // Test 14: Failed details fetching and working drawer retry
  it('14. handles failed details fetching in drawer and successfully recovers when clicking drawer retry', async () => {
    const user = userEvent.setup();
    renderDashboard();

    await waitFor(() => {
      expect(screen.getByTestId('operation-row-OP-00001')).toBeInTheDocument();
    });

    // Make the next fetchOperationById call fail
    vi.spyOn(operationsApi, 'fetchOperationById').mockRejectedValueOnce(
      new Error('Simulated Network Error: Failed to fetch operation OP-00001')
    );

    // Open drawer
    await user.click(screen.getByTestId('operation-row-OP-00001'));

    // Drawer should show error state
    await waitFor(() => {
      expect(screen.getByText(/Failed to load operation details/i)).toBeInTheDocument();
      expect(screen.getByTestId('drawer-retry-btn')).toBeInTheDocument();
    });

    // Click retry inside drawer
    await user.click(screen.getByTestId('drawer-retry-btn'));

    // Details should now load successfully
    await waitFor(() => {
      expect(screen.getByText(/Operational Metadata/i)).toBeInTheDocument();
    });
  });

  // Test 15: Failure simulation ON and OFF behavior
  it('15. verifies failure simulation toggle reliably controls simulation state', async () => {
    const user = userEvent.setup();
    renderDashboard();

    // Verify initial toggle state is OFF
    const toggleBtn = screen.getByTestId('toggle-simulate-failure-btn');
    expect(toggleBtn).toHaveTextContent(/OFF/i);
    expect(operationsApi.getGlobalFailureSimulation()).toBe(false);

    // Toggle simulation ON
    await user.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent(/ON/i);
    expect(operationsApi.getGlobalFailureSimulation()).toBe(true);

    // Toggle simulation OFF
    await user.click(toggleBtn);
    expect(toggleBtn).toHaveTextContent(/OFF/i);
    expect(operationsApi.getGlobalFailureSimulation()).toBe(false);
  });

  it('16. removes a successfully updated operation from the active Pending filter and updates statistics', async () => {
    const user = userEvent.setup();
    renderDashboard({ initialEntries: ['/?status=Pending'] });

    await waitFor(() => {
      expect(screen.getAllByTestId(/^operation-row-OP-/).length).toBeGreaterThan(0);
      expect(screen.getByTestId('stat-count-pending')).toBeInTheDocument();
    });

    const firstRow = screen.getAllByTestId(/^operation-row-OP-/)[0];
    const operationId = firstRow.getAttribute('data-testid').replace('operation-row-', '');
    const originalRecord = getOperationsStore().find((op) => op.id === operationId);
    expect(originalRecord.status).toBe('Pending');

    await user.selectOptions(screen.getByTestId(`quick-status-select-${operationId}`), 'Running');

    await waitFor(() => {
      expect(screen.queryByTestId(`operation-row-${operationId}`)).not.toBeInTheDocument();
      expect(getOperationsStore().find((op) => op.id === operationId).status).toBe('Running');
      expect(screen.getByText(/Status Updated/i)).toBeInTheDocument();
    });

    const stats = getOperationsStore().reduce((counts, op) => {
      counts[op.status.toLowerCase()] += 1;
      return counts;
    }, { pending: 0, running: 0, completed: 0, failed: 0 });
    expect(screen.getByTestId('stat-count-pending')).toHaveTextContent(stats.pending.toLocaleString());
    expect(screen.getByTestId('stat-count-running')).toHaveTextContent(stats.running.toLocaleString());
  });

  it('17. restores the Pending list, details, and statistics after a failed filtered status update', async () => {
    const user = userEvent.setup();
    operationsApi.setConfiguredLatency(100);
    renderDashboard({ initialEntries: ['/?status=Pending'] });

    await waitFor(() => expect(screen.getAllByTestId(/^operation-row-OP-/).length).toBeGreaterThan(0));
    const firstRow = screen.getAllByTestId(/^operation-row-OP-/)[0];
    const operationId = firstRow.getAttribute('data-testid').replace('operation-row-', '');
    const originalStats = getOperationsStore().reduce((counts, op) => {
      counts[op.status.toLowerCase()] += 1;
      return counts;
    }, { pending: 0, running: 0, completed: 0, failed: 0 });

    await user.click(within(firstRow).getByRole('button', { name: /View details/i }));
    await waitFor(() => expect(screen.getByRole('dialog', { name: /Operation Details Drawer/i })).toBeInTheDocument());
    // The drawer first renders its loading skeleton; status controls appear
    // after the operation details query has completed.
    await user.click(await screen.findByTestId('status-option-running'));
    await user.click(screen.getByRole('checkbox', { name: /Simulate API failure on status update/i }));
    await user.click(screen.getByTestId('save-status-btn'));

    await waitFor(() => expect(screen.queryByTestId(`operation-row-${operationId}`)).not.toBeInTheDocument());
    await waitFor(() => expect(screen.getByText(/Status Update Failed/i)).toBeInTheDocument());

    await waitFor(() => {
      expect(screen.getByTestId(`operation-row-${operationId}`)).toBeInTheDocument();
      expect(within(screen.getByTestId(`operation-row-${operationId}`)).getByTestId('status-badge-pending')).toBeInTheDocument();
      expect(within(screen.getByRole('dialog', { name: /Operation Details Drawer/i })).getByTestId('status-badge-pending')).toBeInTheDocument();
      expect(getOperationsStore().find((op) => op.id === operationId).status).toBe('Pending');
      expect(screen.getByTestId('stat-count-pending')).toHaveTextContent(originalStats.pending.toLocaleString());
      expect(screen.getByTestId('stat-count-running')).toHaveTextContent(originalStats.running.toLocaleString());
    });

    // A genuine failure leaves the edit available so the user can retry.
    await user.click(screen.getByRole('checkbox', { name: /Simulate API failure on status update/i }));
    await user.click(screen.getByTestId('save-status-btn'));
    await waitFor(() => {
      expect(getOperationsStore().find((op) => op.id === operationId).status).toBe('Running');
      expect(screen.getByText(/Status Updated/i)).toBeInTheDocument();
    });
  });
});
