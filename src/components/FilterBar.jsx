import { Search, X, RotateCcw, ArrowUpDown, Filter, SlidersHorizontal } from 'lucide-react';

export function FilterBar({
  search = '',
  onSearchChange,
  status = 'All',
  onStatusChange,
  sortBy = 'createdDate',
  sortOrder = 'desc',
  onSortChange,
  pageSize = 10,
  onPageSizeChange,
  onResetFilters,
  isFetching = false,
}) {
  const hasActiveFilters = Boolean(search.trim() || (status && status !== 'All'));

  const toggleSortOrder = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSortFieldChange = (e) => {
    onSortChange(e.target.value, sortOrder);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-3.5 sm:p-4 shadow-2xs space-y-3 transition-all">
      {/* Search & Main Controls Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 sm:gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            data-testid="search-input"
            aria-label="Search operations by name or ID"
            placeholder="Search operations by title or ID (e.g. OP-00102)..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white transition shadow-2xs"
          />
          {search ? (
            <button
              type="button"
              data-testid="clear-search-btn"
              onClick={() => onSearchChange('')}
              aria-label="Clear search text"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          ) : (
            <div className="absolute inset-y-0 right-0 pr-3 hidden sm:flex items-center pointer-events-none">
              <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded">
                ⌘K
              </kbd>
            </div>
          )}
        </div>

        {/* Filter & Sorting Controls Grid (2x2 on mobile, flex on desktop) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
          {/* Status Dropdown */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <label htmlFor="status-filter-select" className="text-slate-500 font-medium truncate">Status:</label>
            </div>
            <select
              id="status-filter-select"
              data-testid="status-filter-select"
              value={status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Running">Running</option>
              <option value="Completed">Completed</option>
              <option value="Failed">Failed</option>
            </select>
          </div>

          {/* Sort Field Selector */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <div className="flex items-center gap-1.5 min-w-0">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <label htmlFor="sort-field-select" className="text-slate-500 font-medium truncate">Sort:</label>
            </div>
            <select
              id="sort-field-select"
              data-testid="sort-field-select"
              value={sortBy}
              onChange={handleSortFieldChange}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="createdDate">Created Date</option>
              <option value="lastUpdatedDate">Last Updated</option>
              <option value="name">Operation Name</option>
              <option value="id">Operation ID</option>
            </select>
          </div>

          {/* Sort Direction Toggle */}
          <button
            type="button"
            data-testid="sort-order-toggle"
            onClick={toggleSortOrder}
            title={`Sort order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
            <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
          </button>

          {/* Page Size Selector */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs">
            <label htmlFor="page-size-select" className="text-slate-500 font-medium">Show:</label>
            <select
              id="page-size-select"
              data-testid="page-size-select"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-transparent text-slate-900 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              data-testid="reset-filters-btn"
              onClick={onResetFilters}
              className="col-span-2 sm:col-span-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition cursor-pointer"
              title="Reset search and filters"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">Filters active:</span>
          {search && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50/80 text-indigo-700 border border-indigo-200 text-xs font-medium shadow-2xs">
              <span>Query: &ldquo;{search}&rdquo;</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-indigo-900 hover:bg-indigo-100/60 rounded-full p-0.5 transition cursor-pointer"
                aria-label="Remove search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {status && status !== 'All' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50/80 text-indigo-700 border border-indigo-200 text-xs font-medium shadow-2xs">
              <span>Status: {status}</span>
              <button
                type="button"
                onClick={() => onStatusChange('All')}
                className="hover:text-indigo-900 hover:bg-indigo-100/60 rounded-full p-0.5 transition cursor-pointer"
                aria-label="Remove status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {isFetching && (
            <span className="text-slate-400 ml-auto flex items-center gap-1.5 text-xs font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
              </span>
              <span>Updating results...</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
