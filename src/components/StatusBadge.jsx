import { CheckCircle2, Clock, PlayCircle, AlertOctagon } from 'lucide-react';

const STATUS_CONFIGS = {
  Pending: {
    bg: 'bg-amber-50/90 text-amber-800 border-amber-200 ring-1 ring-amber-400/20',
    dot: 'bg-amber-500 shadow-xs shadow-amber-200',
    icon: Clock,
  },
  Running: {
    bg: 'bg-sky-50/90 text-sky-800 border-sky-200 ring-1 ring-sky-400/20',
    dot: 'bg-sky-500 animate-pulse shadow-xs shadow-sky-200',
    icon: PlayCircle,
  },
  Completed: {
    bg: 'bg-emerald-50/90 text-emerald-800 border-emerald-200 ring-1 ring-emerald-400/20',
    dot: 'bg-emerald-500 shadow-xs shadow-emerald-200',
    icon: CheckCircle2,
  },
  Failed: {
    bg: 'bg-rose-50/90 text-rose-800 border-rose-200 ring-1 ring-rose-400/20',
    dot: 'bg-rose-500 shadow-xs shadow-rose-200',
    icon: AlertOctagon,
  },
};

export function StatusBadge({ status, showIcon = true, size = 'sm' }) {
  const config = STATUS_CONFIGS[status] || STATUS_CONFIGS.Pending;
  const Icon = config.icon;

  const sizeClasses = size === 'lg'
    ? 'px-3 py-1 text-xs sm:text-sm font-semibold'
    : 'px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold';

  return (
    <span
      data-testid={`status-badge-${status?.toLowerCase()}`}
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs ${config.bg} ${sizeClasses} transition-all duration-150 select-none`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dot}`} aria-hidden="true" />
      {showIcon && <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />}
      <span className="leading-none">{status}</span>
    </span>
  );
}
