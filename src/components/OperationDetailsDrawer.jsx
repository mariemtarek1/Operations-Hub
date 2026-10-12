import { useEffect, useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  MapPin,
  AlertTriangle,
  RotateCcw,
  Check,
  FileText,
  Activity,
  ShieldCheck,
  AlertOctagon,
  PlayCircle,
  CheckCircle2,
  Terminal,
  Copy,
} from 'lucide-react';
import { StatusBadge } from './StatusBadge.jsx';

export function OperationDetailsDrawer({
  operationId,
  isOpen = false,
  onClose,
  operation,
  isLoading = false,
  isError = false,
  error = null,
  onRetry,
  onUpdateStatus,
  isUpdating = false,
}) {
  const [userSelectedStatus, setUserSelectedStatus] = useState(null);
  const [statusNote, setStatusNote] = useState('');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [prevOperationId, setPrevOperationId] = useState(operationId);
  const [copiedId, setCopiedId] = useState(false);

  // Reset local form when a different operation is selected
  if (operationId !== prevOperationId) {
    setPrevOperationId(operationId);
    setUserSelectedStatus(null);
    setStatusNote('');
    setSimulateFailure(false);
  }

  const activeStatus = userSelectedStatus || operation?.status || '';
  const isDirty = userSelectedStatus !== null && userSelectedStatus !== operation?.status;

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyId = () => {
    if (operationId) {
      navigator.clipboard?.writeText(operationId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleStatusSubmit = (e) => {
    e.preventDefault();
    if (!activeStatus || activeStatus === operation?.status) return;

    onUpdateStatus({
      id: operationId,
      status: activeStatus,
      note: statusNote,
      simulateFailure,
    });
  };

  const handleCancelStatusChange = () => {
    setUserSelectedStatus(null);
    setStatusNote('');
  };

  const formatDate = (isoString) => {
    if (!isoString) return '—';
    try {
      const date = new Date(isoString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return isoString;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Operation Details Drawer"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-4 sm:pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col border-l border-slate-200/90 transition-transform duration-300">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/80 backdrop-blur-md flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={handleCopyId}
                  title="Click to copy Operation ID"
                  className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 hover:bg-indigo-100 transition cursor-pointer"
                >
                  <span>{operationId}</span>
                  {copiedId ? (
                    <Check className="h-3 w-3 text-emerald-600" />
                  ) : (
                    <Copy className="h-3 w-3 text-indigo-400" />
                  )}
                </button>
                {operation?.status && <StatusBadge status={operation.status} size="lg" />}
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-2 leading-snug truncate">
                {isLoading
                  ? 'Loading Operation...'
                  : isError
                  ? 'Error Loading Details'
                  : operation?.name || 'Operation Details'}
              </h2>
            </div>
            <button
              type="button"
              data-testid="close-drawer-btn"
              onClick={onClose}
              aria-label="Close drawer"
              className="rounded-xl p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-slate-200/80 rounded w-3/4" />
                <div className="h-28 bg-slate-100 rounded-2xl" />
                <div className="grid grid-cols-2 gap-3">
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                  <div className="h-16 bg-slate-100 rounded-xl" />
                </div>
              </div>
            ) : isError ? (
              <div className="p-5 rounded-2xl border border-rose-200 bg-rose-50/80 text-rose-800 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                  <span>Failed to load operation details</span>
                </div>
                <p className="text-xs text-rose-700 leading-relaxed">
                  {error?.message || 'Could not retrieve operation telemetry from the server.'}
                </p>
                {onRetry && (
                  <button
                    type="button"
                    data-testid="drawer-retry-btn"
                    onClick={onRetry}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs transition cursor-pointer active:scale-95"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Retry Loading</span>
                  </button>
                )}
              </div>
            ) : operation ? (
              <>
                {/* Status Update Control Section */}
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 sm:p-4.5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                      <Activity className="h-4 w-4 text-indigo-600" />
                      <span>Update Operation Status</span>
                    </h3>
                    {isDirty && (
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-100/70 px-2 py-0.5 rounded-full border border-indigo-200">
                        Unsaved changes
                      </span>
                    )}
                  </div>

                  <form onSubmit={handleStatusSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'Pending', icon: Clock },
                        { id: 'Running', icon: PlayCircle },
                        { id: 'Completed', icon: CheckCircle2 },
                        { id: 'Failed', icon: AlertOctagon },
                      ].map(({ id: st, icon: StatusIcon }) => {
                        const isCurrent = operation.status === st;
                        const isSelected = activeStatus === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            data-testid={`status-option-${st.toLowerCase()}`}
                            onClick={() => setUserSelectedStatus(st)}
                            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold border transition duration-150 text-center cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-300'
                                : 'bg-white text-slate-700 border-slate-200/90 hover:border-slate-300 hover:bg-slate-50'
                            }`}
                          >
                            <StatusIcon className="h-4 w-4 mb-1" />
                            <span>{st}</span>
                            {isCurrent && <span className="text-[9px] opacity-80 font-normal">(Current)</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="space-y-2.5 pt-1">
                      <input
                        type="text"
                        placeholder="Optional audit reason or notes..."
                        value={statusNote}
                        onChange={(e) => setStatusNote(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                      />

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                        <label className="flex items-center gap-2 text-[11px] text-slate-500 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={simulateFailure}
                            onChange={(e) => setSimulateFailure(e.target.checked)}
                            className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Simulate API failure on status update</span>
                        </label>

                        <div className="flex items-center justify-end gap-2">
                          {isDirty && (
                            <button
                              type="button"
                              onClick={handleCancelStatusChange}
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            type="submit"
                            data-testid="save-status-btn"
                            disabled={isUpdating || !isDirty}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-xs cursor-pointer active:scale-95"
                          >
                            {isUpdating ? <RotateCcw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                            <span>{isUpdating ? 'Saving...' : 'Save Status'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span>Description & Intent</span>
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50/90 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-sans">
                    {operation.description}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                    Operational Metadata
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                        <User className="h-3 w-3 text-slate-400" /> Owner
                      </span>
                      <p className="font-bold text-slate-900 mt-1">{operation.owner}</p>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                        <ShieldCheck className="h-3 w-3 text-slate-400" /> Priority & Env
                      </span>
                      <p className="font-bold text-slate-900 mt-1">
                        {operation.priority} • {operation.environment}
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                        <MapPin className="h-3 w-3 text-slate-400" /> Region & Topology
                      </span>
                      <p className="font-bold text-slate-900 mt-1">{operation.region}</p>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                        <Clock className="h-3 w-3 text-slate-400" /> Runtime Duration
                      </span>
                      <p className="font-bold text-slate-900 mt-1">
                        {operation.duration} ({operation.retryCount} retries)
                      </p>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                        <Calendar className="h-3 w-3 text-slate-400" /> Created At
                      </span>
                      <p className="font-semibold text-slate-700 mt-1 font-mono text-[11px]">{formatDate(operation.createdDate)}</p>
                    </div>

                    <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
                      <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium">
                        <Calendar className="h-3 w-3 text-slate-400" /> Last Updated
                      </span>
                      <p className="font-semibold text-slate-700 mt-1 font-mono text-[11px]" data-testid="drawer-last-updated">
                        {formatDate(operation.lastUpdatedDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Audit & Execution Logs */}
                {operation.logs && operation.logs.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-slate-400" />
                      <span>Execution Telemetry & Audit Logs</span>
                    </h4>
                    <div className="border border-slate-200/90 rounded-xl divide-y divide-slate-100 max-h-52 overflow-y-auto bg-slate-900 text-slate-200 font-mono text-[11px] p-1 shadow-2xs">
                      {operation.logs.map((log, idx) => (
                        <div key={log.id || idx} className="p-2.5 rounded-lg hover:bg-slate-800/80 transition-colors">
                          <div className="flex items-center justify-between text-slate-400 mb-1 text-[10px]">
                            <span className={`font-bold ${
                              log.level === 'ERROR'
                                ? 'text-rose-400'
                                : log.level === 'SUCCESS'
                                ? 'text-emerald-400'
                                : 'text-sky-400'
                            }`}>
                              [{log.level}]
                            </span>
                            <span className="text-slate-500">{formatDate(log.timestamp)}</span>
                          </div>
                          <p className="text-slate-300 leading-relaxed font-sans">{log.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-200/80 bg-slate-50/50 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 hover:border-slate-300 transition cursor-pointer shadow-2xs"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
