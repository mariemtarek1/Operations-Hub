import { Layers, Clock, PlayCircle, CheckCircle2, AlertOctagon } from 'lucide-react';

export function SummaryCards({
  stats,
  isLoading = false,
  selectedStatus = 'All',
  onSelectStatus,
}) {
  const total = stats?.total || 0;
  const pending = stats?.pending || 0;
  const running = stats?.running || 0;
  const completed = stats?.completed || 0;
  const failed = stats?.failed || 0;

  const calculatePct = (count) => {
    if (!total) return '0%';
    return `${Math.round((count / total) * 100)}%`;
  };

  const cards = [
    {
      id: 'All',
      title: 'Total Operations',
      count: total,
      pct: '100%',
      icon: Layers,
      color: 'indigo',
      activeBorder: 'border-indigo-600 ring-1 ring-indigo-500/30 bg-indigo-50/10 shadow-2xs',
      iconBg: 'bg-slate-100 text-slate-700',
      badgeBg: 'bg-slate-100 text-slate-700',
      visibility: 'hidden sm:flex', // Hidden on mobile, shows 4 cards on mobile
    },
    {
      id: 'Pending',
      title: 'Pending',
      count: pending,
      pct: calculatePct(pending),
      icon: Clock,
      color: 'amber',
      activeBorder: 'border-amber-500 ring-1 ring-amber-500/30 bg-amber-50/10 shadow-2xs',
      iconBg: 'bg-amber-50 text-amber-600',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      visibility: 'flex',
    },
    {
      id: 'Running',
      title: 'Running',
      count: running,
      pct: calculatePct(running),
      icon: PlayCircle,
      color: 'sky',
      activeBorder: 'border-sky-500 ring-1 ring-sky-500/30 bg-sky-50/10 shadow-2xs',
      iconBg: 'bg-sky-50 text-sky-600',
      badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
      visibility: 'flex',
    },
    {
      id: 'Completed',
      title: 'Completed',
      count: completed,
      pct: calculatePct(completed),
      icon: CheckCircle2,
      color: 'emerald',
      activeBorder: 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/10 shadow-2xs',
      iconBg: 'bg-emerald-50 text-emerald-600',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      visibility: 'flex',
    },
    {
      id: 'Failed',
      title: 'Failed',
      count: failed,
      pct: calculatePct(failed),
      icon: AlertOctagon,
      color: 'rose',
      activeBorder: 'border-rose-500 ring-1 ring-rose-500/30 bg-rose-50/10 shadow-2xs',
      iconBg: 'bg-rose-50 text-rose-600',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      visibility: 'flex',
    },
  ];

  return (
    <section aria-label="Operations Overview Statistics" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = selectedStatus === card.id;

        return (
          <button
            key={card.id}
            type="button"
            onClick={() => onSelectStatus(card.id)}
            data-testid={`stat-card-${card.id.toLowerCase()}`}
            className={`group text-left rounded-xl p-3.5 sm:p-4 bg-white border transition duration-150 cursor-pointer flex-col justify-between ${
              card.visibility
            } ${
              isSelected
                ? card.activeBorder
                : 'border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-xs font-medium text-slate-500 truncate group-hover:text-slate-700 transition-colors">
                  {card.title}
                </span>
                <div className={`p-1.5 rounded-lg shrink-0 ${card.iconBg}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-2">
                {isLoading ? (
                  <div className="h-7 w-16 bg-slate-200 animate-pulse rounded" />
                ) : (
                  <span
                    className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900"
                    data-testid={`stat-count-${card.id.toLowerCase()}`}
                  >
                    {card.count.toLocaleString()}
                  </span>
                )}

                {card.id !== 'All' && !isLoading && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${card.badgeBg}`}>
                    {card.pct}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
              <span className={`font-medium ${isSelected ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>
                {isSelected ? 'Filtering active' : 'Click to filter'}
              </span>
              <span className={`h-1.5 w-1.5 rounded-full transition-all ${
                isSelected ? 'bg-indigo-600' : 'bg-transparent'
              }`} />
            </div>
          </button>
        );
      })}
    </section>
  );
}
