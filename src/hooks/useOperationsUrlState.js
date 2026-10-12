import { useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_SORT_BY = 'createdDate';
const DEFAULT_SORT_ORDER = 'desc';
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const DEFAULT_STATUS = 'All';

/**
 * Custom hook to synchronize dashboard filter/pagination/sort/details state with URL query parameters.
 */
export function useOperationsUrlState() {
  const [searchParams, setSearchParams] = useSearchParams();

  const state = useMemo(() => {
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || DEFAULT_STATUS;
    const sortBy = searchParams.get('sortBy') || DEFAULT_SORT_BY;
    const sortOrder = searchParams.get('sortOrder') || DEFAULT_SORT_ORDER;
    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawPageSize = parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10);
    const selectedId = searchParams.get('selectedId') || null;

    return {
      search,
      status,
      sortBy,
      sortOrder,
      page: isNaN(rawPage) || rawPage < 1 ? DEFAULT_PAGE : rawPage,
      pageSize: isNaN(rawPageSize) || rawPageSize < 1 ? DEFAULT_PAGE_SIZE : rawPageSize,
      selectedId,
    };
  }, [searchParams]);

  const updateParams = useCallback((updater) => {
    setSearchParams((prevParams) => {
      const next = new URLSearchParams(prevParams);
      const updates = typeof updater === 'function' ? updater(next) : updater;

      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '' || value === 'All') {
          // Clean default or empty values from URL for cleaner URLs
          if (key === 'status' && value === 'All') {
            next.delete('status');
          } else if (key === 'page' && Number(value) === 1) {
            next.delete('page');
          } else if (key === 'pageSize' && Number(value) === DEFAULT_PAGE_SIZE) {
            next.delete('pageSize');
          } else if (key === 'sortBy' && value === DEFAULT_SORT_BY) {
            next.delete('sortBy');
          } else if (key === 'sortOrder' && value === DEFAULT_SORT_ORDER) {
            next.delete('sortOrder');
          } else if (value === '' || value === null) {
            next.delete(key);
          } else {
            next.set(key, String(value));
          }
        } else {
          // If value is non-default, set it
          if (key === 'page' && Number(value) === 1) {
            next.delete('page');
          } else if (key === 'pageSize' && Number(value) === DEFAULT_PAGE_SIZE) {
            next.delete('pageSize');
          } else if (key === 'sortBy' && value === DEFAULT_SORT_BY) {
            next.delete('sortBy');
          } else if (key === 'sortOrder' && value === DEFAULT_SORT_ORDER) {
            next.delete('sortOrder');
          } else {
            next.set(key, String(value));
          }
        }
      });

      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = useCallback((search) => {
    updateParams({ search, page: 1 });
  }, [updateParams]);

  const setStatus = useCallback((status) => {
    updateParams({ status, page: 1 });
  }, [updateParams]);

  const setSorting = useCallback((sortBy, sortOrder) => {
    updateParams({ sortBy, sortOrder });
  }, [updateParams]);

  const setPage = useCallback((page) => {
    updateParams({ page });
  }, [updateParams]);

  const setPageSize = useCallback((pageSize) => {
    updateParams({ pageSize, page: 1 });
  }, [updateParams]);

  const setSelectedId = useCallback((selectedId) => {
    updateParams({ selectedId });
  }, [updateParams]);

  const resetAllFilters = useCallback(() => {
    setSearchParams((prevParams) => {
      const next = new URLSearchParams();
      // Keep selectedId if open, or clear all
      const currentSelected = prevParams.get('selectedId');
      if (currentSelected) {
        next.set('selectedId', currentSelected);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  return {
    ...state,
    setSearch,
    setStatus,
    setSorting,
    setPage,
    setPageSize,
    setSelectedId,
    resetAllFilters,
  };
}
