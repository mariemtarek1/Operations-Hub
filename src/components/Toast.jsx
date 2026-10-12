import { CheckCircle2, AlertOctagon, X, Info } from 'lucide-react';

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';

  return (
    <div
      role="alert"
      className={`fixed bottom-5 right-5 left-5 sm:left-auto sm:max-w-md z-50 flex items-start gap-3.5 rounded-2xl border p-4 shadow-xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
        isSuccess
          ? 'bg-emerald-50/95 text-emerald-950 border-emerald-300/80 shadow-emerald-500/10'
          : isError
          ? 'bg-rose-50/95 text-rose-950 border-rose-300/80 shadow-rose-500/10'
          : 'bg-white/95 text-slate-900 border-slate-200 shadow-slate-500/10'
      }`}
    >
      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
        isSuccess
          ? 'bg-emerald-100/80 text-emerald-700'
          : isError
          ? 'bg-rose-100/80 text-rose-700'
          : 'bg-indigo-50 text-indigo-700'
      }`}>
        {isSuccess && <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
        {isError && <AlertOctagon className="h-4 w-4" aria-hidden="true" />}
        {!isSuccess && !isError && <Info className="h-4 w-4" aria-hidden="true" />}
      </div>
      <div className="flex-1 min-w-0">
        {toast.title && <h3 className="text-xs sm:text-sm font-bold tracking-tight">{toast.title}</h3>}
        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed break-words">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss alert"
        className="rounded-xl p-1 text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 transition cursor-pointer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
