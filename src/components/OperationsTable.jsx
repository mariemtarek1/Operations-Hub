import { useRef, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown, Pencil, AlertCircle, RotateCcw, ShieldAlert } from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';

export function OperationsTable({
  operations = [],
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  onSelectOperation,
  sortBy = 'lastUpdatedDate',
  sortOrder = 'desc',
  onSortChange,
  onQuickStatusChange,
  onResetFilters,
}) {
  const tableContainerRef = useRef(null);

  // Keep table anchored at start whenever operations update
  useEffect(() => {
    if (tableContainerRef.current) {
      tableContainerRef.current.scrollLeft = 0;
    }
  }, [operations]);

  const handleSortHeader = (field) => {
    if (sortBy === field) {
      onSortChange(field, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(field, 'desc');
    }
  };

  const renderSortIcon = (field) => {
    if (sortBy !== field) {
      return <ArrowUpDown className="h-3 w-3 text-slate-300 group-hover:text-slate-500 transition-colors" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-indigo-600 font-bold" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-indigo-600 font-bold" />
    );
  };

  const formatDateTime = (isoString) => {
    if (!isoString) return { date: '—', time: '' };
    try {
      const d = new Date(isoString);
      const date = new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(d);
      const time = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(d);
      return { date, time };
    } catch {
      return { date: isoString, time: '' };
    }
  };

  // Helper to extract initials for owner avatar
  const getInitials = (name) => {
    if (!name) return 'OP';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Error State
  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-rose-200/90 p-8 sm:p-12 text-center shadow-xs">
        <div className="mx-auto h-14 w-14 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 mb-4 ring-8 ring-rose-50/50">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-900">Failed to Load Operations</h3>
        <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 mb-5 leading-relaxed">
          {error?.message || 'An unexpected error occurred while communicating with the operations telemetry service.'}
        </p>
        <button
          type="button"
          data-testid="retry-btn"
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-sm shadow-rose-200 transition-all cursor-pointer active:scale-95"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          <span>Retry Request</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden transition-all">
      {/* Table Top Bar */}
      <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
        <span className="font-semibold text-slate-700 text-[11px] sm:text-xs">Fleet Operations</span>
        <span className="text-[11px] text-slate-400 block lg:hidden">
          ↔ Swipe horizontally to view all columns
        </span>
      </div>

      <div ref={tableContainerRef} className="overflow-x-auto w-full table-scrollbar">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px] select-none">
              <th scope="col" className="py-2.5 px-3 w-20 whitespace-nowrap sticky left-0 bg-slate-50/95 backdrop-blur-xs z-10 border-r border-slate-200/50">
                <button
                  type="button"
                  onClick={() => handleSortHeader('id')}
                  className="group flex items-center gap-1 hover:text-indigo-600 focus:outline-none transition cursor-pointer"
                >
                  <span>ID</span>
                  {renderSortIcon('id')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-3 min-w-[160px] max-w-[220px]">
                <button
                  type="button"
                  onClick={() => handleSortHeader('name')}
                  className="group flex items-center gap-1 hover:text-indigo-600 focus:outline-none transition cursor-pointer"
                >
                  <span>Operation Name</span>
                  {renderSortIcon('name')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-3 whitespace-nowrap">Owner</th>
              <th scope="col" className="py-2.5 px-3 whitespace-nowrap">Status</th>
              <th scope="col" className="py-2.5 px-3 whitespace-nowrap">Priority</th>
              <th scope="col" className="py-2.5 px-3 whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => handleSortHeader('lastUpdatedDate')}
                  className="group flex items-center gap-1 hover:text-indigo-600 focus:outline-none transition cursor-pointer"
                >
                  <span>Last Updated</span>
                  {renderSortIcon('lastUpdatedDate')}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {isLoading ? (
              // Loading Skeletons
              Array.from({ length: 8 }).map((_, index) => (
                <tr key={`skeleton-${index}`} className="animate-pulse">
                  <td className="py-2.5 px-3 sticky left-0 bg-white border-r border-slate-100"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3">
                    <div className="h-4 w-36 bg-slate-200 rounded mb-1" />
                    <div className="h-3 w-24 bg-slate-100 rounded" />
                  </td>
                  <td className="py-2.5 px-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3"><div className="h-5 w-16 bg-slate-200 rounded-full" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-12 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3"><div className="h-4 w-16 bg-slate-200 rounded" /></td>
                  <td className="py-2.5 px-3 text-right"><div className="h-6 w-16 bg-slate-200 rounded ml-auto" /></td>
                </tr>
              ))
            ) : operations.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={7} className="py-12 px-4 text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <AlertCircle className="h-6 w-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No Operations Found</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
                    No operation records match your active search filter or status selection.
                  </p>
                  <button
                    type="button"
                    onClick={onResetFilters}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Reset All Filters</span>
                  </button>
                </td>
              </tr>
            ) : (
              // Operations Rows: all 7 columns clearly displayed
              operations.map((op) => {
                const priorityStyles = {
                  Critical: 'text-rose-700 bg-rose-50 border-rose-200',
                  High: 'text-orange-700 bg-orange-50 border-orange-200',
                  Medium: 'text-amber-700 bg-amber-50 border-amber-200',
                  Low: 'text-slate-600 bg-slate-100 border-slate-200',
                };
                const priorityClass = priorityStyles[op.priority] || priorityStyles.Medium;
                const updatedDateTime = formatDateTime(op.lastUpdatedDate);

                return (
                  <tr
                    key={op.id}
                    data-testid={`operation-row-${op.id}`}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => onSelectOperation(op.id)}
                  >
                    {/* ID (Sticky on horizontal scroll) */}
                    <td className="py-2.5 px-3 font-mono font-bold text-indigo-600 whitespace-nowrap sticky left-0 bg-white group-hover:bg-slate-50 transition-colors z-10 border-r border-slate-100">
                      <span className="text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200/80">
                        {op.id}
                      </span>
                    </td>

                    {/* Operation Name & Description */}
                    <td className="py-2.5 px-3 min-w-[160px] max-w-[220px]">
                      <div className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate" title={op.name}>
                        {op.name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5" title={op.description}>
                        {op.description}
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <span className="h-5 w-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[9px] flex items-center justify-center border border-slate-200 shrink-0">
                          {getInitials(op.owner)}
                        </span>
                        <span className="truncate max-w-[100px]">{op.owner}</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <StatusBadge status={op.status} />
                    </td>

                    {/* Priority */}
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${priorityClass}`}>
                        {op.priority}
                      </span>
                    </td>

                    {/* Last Updated Date */}
                    <td className="py-2.5 px-3 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-slate-700 leading-tight">{updatedDateTime.date}</div>
                      <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{updatedDateTime.time}</div>
                    </td>

                    {/* Quick Status and Actions */}
                    <td className="py-2.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Status Dropdown */}
                        <select
                          aria-label={`Change status for ${op.id}`}
                          data-testid={`quick-status-select-${op.id}`}
                          value={op.status}
                          onChange={(e) => onQuickStatusChange(op.id, e.target.value)}
                          className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-[11px] font-medium text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Running">Running</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>

                        {/* Details / Edit Button */}
                        <button
                          type="button"
                          data-testid={`view-details-btn-${op.id}`}
                          onClick={() => onSelectOperation(op.id)}
                          aria-label={`View details for ${op.id}`}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit & view operation details"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
