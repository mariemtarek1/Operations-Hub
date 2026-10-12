/**
 * Mock API Service for Operations Management Dashboard
 * Implements server-side filtering, searching, sorting, pagination,
 * AbortSignal cancellation, network latency simulation, and probabilistic failure injection.
 */

import { getOperationsStore } from './mockData.js';

let globalFailureSimulation = false;
// Probabilistic failure rate when global simulation is ON (35% in browser, 100% in test by default)
let failureProbability = 0.35;
let configuredLatency = null; // null means auto-detect (150ms in browser, 0ms in test)

export function setGlobalFailureSimulation(enabled, customProbability = null) {
  globalFailureSimulation = Boolean(enabled);
  if (customProbability !== null) {
    failureProbability = Math.max(0, Math.min(1, Number(customProbability)));
  }
}

export function getGlobalFailureSimulation() {
  return globalFailureSimulation;
}

export function setFailureProbability(prob) {
  failureProbability = Math.max(0, Math.min(1, Number(prob)));
}

export function getFailureProbability() {
  return failureProbability;
}

export function setConfiguredLatency(ms) {
  configuredLatency = ms;
}

export function getConfiguredLatency() {
  return configuredLatency;
}

/**
 * Check if the current request should trigger a simulated failure.
 * - explicitFlag === true: forces failure (deterministic test or UI checkbox)
 * - explicitFlag === false && !globalFailureSimulation: never fails
 * - globalFailureSimulation === true: fails probabilistically
 */
function shouldSimulateFailure(explicitFlag) {
  if (explicitFlag === true) {
    return true;
  }
  if (!globalFailureSimulation) {
    return false;
  }
  // If in vitest/node test environment and no custom probability set, default to 100% so tests are deterministic
  if (
    typeof globalThis !== 'undefined' &&
    globalThis.process?.env?.NODE_ENV === 'test' &&
    failureProbability === 0.35
  ) {
    return true;
  }
  return Math.random() < failureProbability;
}

/**
 * Determine artificial latency based on environment.
 */
function resolveLatency() {
  if (configuredLatency !== null) {
    return configuredLatency;
  }
  // Instant in test environment
  if (typeof globalThis !== 'undefined' && globalThis.process?.env?.NODE_ENV === 'test') {
    return 0;
  }
  // Variable network latency in browser: 120ms - 220ms
  return 120 + Math.floor(Math.random() * 100);
}

/**
 * Helper to simulate network latency with AbortSignal cancellation support.
 */
function simulateNetworkDelay(signal, overrideDelay = null) {
  const delayMs = overrideDelay !== null ? overrideDelay : resolveLatency();

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new DOMException('The operation was aborted', 'AbortError'));
    }

    if (delayMs <= 0) {
      return resolve();
    }

    const timer = setTimeout(() => {
      resolve();
    }, delayMs);

    if (signal) {
      const abortHandler = () => {
        clearTimeout(timer);
        reject(new DOMException('The operation was aborted', 'AbortError'));
      };
      signal.addEventListener('abort', abortHandler, { once: true });
    }
  });
}

/**
 * Fetch paginated operations with server-side query filters.
 */
export async function fetchOperations({
  search = '',
  status = 'All',
  sortBy = 'createdDate',
  sortOrder = 'desc',
  page = 1,
  pageSize = 10,
  signal,
  simulateFailure,
  delay = null,
} = {}) {
  await simulateNetworkDelay(signal, delay);

  if (shouldSimulateFailure(simulateFailure)) {
    throw new Error('Simulated Network Error: Failed to fetch operations from server (500 Internal Server Error)');
  }

  const allRecords = getOperationsStore();
  const trimmedSearch = (search || '').trim().toLowerCase();

  // 1. Server-side Filtering: Search
  let filtered = allRecords;
  if (trimmedSearch) {
    filtered = filtered.filter((op) => {
      return (
        op.id.toLowerCase().includes(trimmedSearch) ||
        op.name.toLowerCase().includes(trimmedSearch) ||
        op.owner.toLowerCase().includes(trimmedSearch)
      );
    });
  }

  // 2. Server-side Filtering: Status
  if (status && status !== 'All') {
    filtered = filtered.filter((op) => op.status.toLowerCase() === status.toLowerCase());
  }

  // 3. Server-side Sorting
  const sorted = [...filtered].sort((a, b) => {
    let valA = a[sortBy];
    let valB = b[sortBy];

    if (sortBy === 'createdDate' || sortBy === 'lastUpdatedDate') {
      valA = new Date(valA).getTime();
      valB = new Date(valB).getTime();
    } else if (typeof valA === 'string') {
      valA = valA.toLowerCase();
      valB = (valB || '').toLowerCase();
    }

    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // 4. Server-side Pagination
  const numericPage = Math.max(1, parseInt(page, 10) || 1);
  const numericPageSize = Math.max(1, parseInt(pageSize, 10) || 10);
  const totalRecords = sorted.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / numericPageSize));

  const startIndex = (numericPage - 1) * numericPageSize;
  const pageData = sorted.slice(startIndex, startIndex + numericPageSize);

  return {
    data: pageData,
    totalRecords,
    page: numericPage,
    pageSize: numericPageSize,
    totalPages,
  };
}

/**
 * Fetch a single operation record by ID.
 */
export async function fetchOperationById(id, { signal, simulateFailure, delay = null } = {}) {
  await simulateNetworkDelay(signal, delay);

  if (shouldSimulateFailure(simulateFailure)) {
    throw new Error(`Simulated Network Error: Failed to fetch operation ${id}`);
  }

  const allRecords = getOperationsStore();
  const record = allRecords.find((op) => op.id.toLowerCase() === String(id).toLowerCase());

  if (!record) {
    throw new Error(`Operation with ID "${id}" was not found.`);
  }

  return JSON.parse(JSON.stringify(record));
}

/**
 * Fetch status statistics across all operations.
 */
export async function fetchOperationStats({ signal, simulateFailure, delay = null } = {}) {
  await simulateNetworkDelay(signal, delay);

  if (shouldSimulateFailure(simulateFailure)) {
    throw new Error('Simulated Network Error: Failed to fetch operation statistics');
  }

  const allRecords = getOperationsStore();
  let pending = 0;
  let running = 0;
  let completed = 0;
  let failed = 0;

  for (const op of allRecords) {
    switch (op.status) {
      case 'Pending':
        pending++;
        break;
      case 'Running':
        running++;
        break;
      case 'Completed':
        completed++;
        break;
      case 'Failed':
        failed++;
        break;
      default:
        break;
    }
  }

  return {
    total: allRecords.length,
    pending,
    running,
    completed,
    failed,
  };
}

/**
 * Update an operation's status.
 */
export async function updateOperationStatus({
  id,
  status,
  note = '',
  signal,
  simulateFailure,
  delay = null,
} = {}) {
  await simulateNetworkDelay(signal, delay);

  if (shouldSimulateFailure(simulateFailure)) {
    throw new Error(`Simulated Network Error: Failed to update status of ${id} to ${status}`);
  }

  const allRecords = getOperationsStore();
  const index = allRecords.findIndex((op) => op.id.toLowerCase() === String(id).toLowerCase());

  if (index === -1) {
    throw new Error(`Operation with ID "${id}" was not found.`);
  }

  const existing = allRecords[index];
  const oldStatus = existing.status;
  const now = new Date().toISOString();

  const updatedRecord = {
    ...existing,
    status,
    lastUpdatedDate: now,
    logs: [
      ...(existing.logs || []),
      {
        id: `log-${Date.now()}`,
        timestamp: now,
        level: status === 'Failed' ? 'ERROR' : status === 'Completed' ? 'SUCCESS' : 'INFO',
        message: `Status transitioned from ${oldStatus} to ${status}${note ? `: ${note}` : '.'}`,
      },
    ],
  };

  allRecords[index] = updatedRecord;

  return JSON.parse(JSON.stringify(updatedRecord));
}
