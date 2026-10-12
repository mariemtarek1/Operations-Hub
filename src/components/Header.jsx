import { Activity, RefreshCw, AlertTriangle } from 'lucide-react';

export function Header({
  isRefetching = false,
  onRefresh,
  simulateFailure = false,
  failureProbability = 0.35,
  onToggleSimulateFailure,
}) {
  const probPercent = Math.round(failureProbability * 100);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          {/* Brand & Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm shadow-indigo-200 shrink-0 ring-1 ring-indigo-500/20">
              <Activity className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold tracking-tight text-slate-900 leading-tight">
                  Operations Management Dashboard
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="tracking-wide">Live Fleet</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 truncate hidden sm:block">
                Real-time orchestration & telemetry control for 5,200 mock operation records.
              </p>
            </div>
          </div>

          {/* Header Action Controls */}
          <div className="flex items-center gap-2 sm:gap-2.5 self-stretch sm:self-auto justify-end">
            {/* Failure Simulation Mode Toggle */}
            <button
              type="button"
              data-testid="toggle-simulate-failure-btn"
              onClick={onToggleSimulateFailure}
              aria-pressed={simulateFailure}
              title={`Simulated Network Failures are currently ${
                simulateFailure ? `ON (${probPercent}% rate)` : 'OFF'
              }. Click to toggle.`}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                simulateFailure
                  ? 'bg-amber-50/90 text-amber-900 border-amber-300 ring-2 ring-amber-400/30 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {simulateFailure ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                    </span>
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  </>
                ) : (
                  <span className="inline-block h-2 w-2 rounded-full bg-slate-300" />
                )}
                <span>Simulate Failures:</span>
                <span
                  className={`font-mono font-bold ${
                    simulateFailure ? 'text-amber-700' : 'text-slate-500'
                  }`}
                >
                  {simulateFailure ? `ON (${probPercent}%)` : 'OFF'}
                </span>
              </div>
            </button>

            {/* Manual Refresh Button */}
            <button
              type="button"
              data-testid="header-refresh-btn"
              onClick={onRefresh}
              disabled={isRefetching}
              aria-label="Refresh telemetry data"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold bg-white text-slate-700 border border-slate-200/90 hover:bg-slate-50 hover:border-slate-300 hover:text-indigo-600 disabled:opacity-50 transition-all duration-150 shadow-2xs cursor-pointer active:scale-95"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin text-indigo-600' : 'text-slate-500'}`} />
              <span className="hidden xs:inline">{isRefetching ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
