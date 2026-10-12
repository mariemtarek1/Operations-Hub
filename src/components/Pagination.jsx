import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function Pagination({
  page = 1,
  pageSize = 10,
  totalRecords = 0,
  totalPages = 1,
  onPageChange,
}) {
  if (totalRecords === 0) return null;

  const startRecord = Math.min((page - 1) * pageSize + 1, totalRecords);
  const endRecord = Math.min(page * pageSize, totalRecords);

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(1, page - 2);
      let end = Math.min(totalPages, page + 2);

      if (page <= 3) {
        start = 1;
        end = maxVisiblePages;
      } else if (page >= totalPages - 2) {
        start = totalPages - maxVisiblePages + 1;
        end = totalPages;
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <nav
      aria-label="Pagination Navigation"
      className="bg-white rounded-2xl border border-slate-200/90 px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs transition-all"
    >
      <div className="text-xs text-slate-500 font-medium text-center sm:text-left">
        Showing <span className="font-bold text-slate-900">{startRecord.toLocaleString()}</span> to{' '}
        <span className="font-bold text-slate-900">{endRecord.toLocaleString()}</span> of{' '}
        <span className="font-bold text-slate-900">{totalRecords.toLocaleString()}</span> operations
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap justify-center">
        {/* First page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          aria-label="Go to first page"
          className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
        >
          <ChevronsLeft className="h-4 w-4" />
        </button>

        {/* Previous page */}
        <button
          type="button"
          data-testid="prev-page-btn"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          aria-label="Go to previous page"
          className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Page buttons */}
        <div className="flex items-center gap-1 mx-0.5 sm:mx-1">
          {pageNumbers[0] > 1 && (
            <>
              <button
                type="button"
                onClick={() => onPageChange(1)}
                className="h-8 min-w-[32px] sm:min-w-[36px] px-2 rounded-xl text-xs font-bold border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer"
              >
                1
              </button>
              {pageNumbers[0] > 2 && <span className="text-slate-400 px-1 text-xs">...</span>}
            </>
          )}

          {pageNumbers.map((p) => {
            const isActive = p === page;
            return (
              <button
                key={p}
                type="button"
                data-testid={`page-btn-${p}`}
                onClick={() => onPageChange(p)}
                aria-current={isActive ? 'page' : undefined}
                className={`h-8 min-w-[32px] sm:min-w-[36px] px-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-200 ring-2 ring-indigo-300/40'
                    : 'border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
                }`}
              >
                {p}
              </button>
            );
          })}

          {pageNumbers[pageNumbers.length - 1] < totalPages && (
            <>
              {pageNumbers[pageNumbers.length - 1] < totalPages - 1 && (
                <span className="text-slate-400 px-1 text-xs">...</span>
              )}
              <button
                type="button"
                onClick={() => onPageChange(totalPages)}
                className="h-8 min-w-[32px] sm:min-w-[36px] px-2 rounded-xl text-xs font-bold border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next page */}
        <button
          type="button"
          data-testid="next-page-btn"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          aria-label="Go to next page"
          className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        {/* Last page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          aria-label="Go to last page"
          className="p-1.5 sm:p-2 rounded-xl border border-slate-200/90 text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
        >
          <ChevronsRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
