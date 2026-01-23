'use client';

import * as React from 'react';
import type { AlertItem } from '@/lib/adapters/alertsAdapter';
import { Badge, BellRing, CircleDollarSign, MessageCircleWarning, Filter } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

function fmtDate(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function AlertIcon({ type }: { type: string }) {
  if (type === 'PAYMENT') return <CircleDollarSign size={16} className="text-red-400" />;
  if (type === 'HANDOFF') return <MessageCircleWarning size={16} className="text-amber-400" />;
  return <BellRing size={16} />;
}

export function AlertList({
  items,
  activeId,
  onSelect
}: {
  items: AlertItem[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const [priorityFilter, setPriorityFilter] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
     if (!priorityFilter) return items;
     return items.filter(i => i.priority === priorityFilter);
  }, [items, priorityFilter]);

  if (items.length === 0) return (
     <div className="h-full flex items-center justify-center p-4">
        <EmptyState 
           title="All caught up!" 
           description="There are no active alerts in this queue." 
           heightClass="h-64 border-none bg-transparent"
        />
     </div>
  );

  return (
    <div className="ui-conv flex flex-col h-full">
      <div className="ui-conv__header flex items-center justify-between">
        <div>
           <div className="ui-conv__title">Queue</div>
           <div className="ui-conv__meta">{filtered.length} items</div>
        </div>
        
        {/* Compact filters */}
        <div className="flex gap-1">
           {['HIGH', 'MEDIUM', 'LOW'].map(p => (
              <button
                key={p}
                title={`Filter ${p}`}
                onClick={() => setPriorityFilter(priorityFilter === p ? null : p)}
                className={`w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold border transition-all ${
                   priorityFilter === p ? 'bg-foreground text-background border-foreground' : 'text-muted-foreground border-border/20 hover:border-border/60'
                }`}
              >
                 {p[0]}
              </button>
           ))}
        </div>
      </div>

      <div className="ui-conv__list space-y-2 p-2">
        {filtered.length === 0 && (
          <div className="p-4 text-center text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2">
            No alerts match this priority filter.
          </div>
        )}

        {filtered.map((item) => {
          const active = item.id === activeId;
          
          let badgeClass = 'ui-badge--neutral';
          if (item.priority === 'HIGH') badgeClass = 'ui-badge--danger';
          if (item.priority === 'MEDIUM') badgeClass = 'ui-badge--warning';
          
          return (
            <button
              key={item.id}
              type="button"
              className={`text-left w-full cursor-pointer transition-all rounded-lg border p-3 group relative overflow-hidden ${
                 active 
                   ? 'bg-muted border-primary/40 shadow-sm' 
                   : 'bg-background border-transparent hover:bg-muted/40 hover:border-border/30'
              }`}
              onClick={() => onSelect(item.id)}
            >
              {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
              
              <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertIcon type={item.type} />
                    <span className={`font-semibold text-sm truncate ${active ? 'text-primary' : 'text-foreground'}`}>
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap bg-muted/30 px-1.5 py-0.5 rounded">
                     {fmtDate(item.createdAt)}
                  </span>
              </div>

              <div className="text-xs text-muted-foreground line-clamp-2 pl-6 mb-3 opacity-90">
                {item.subtitle}
              </div>
              
              <div className="flex items-center justify-between pl-6">
                  <div className="flex items-center gap-2">
                    <span className={`ui-badge ${badgeClass} text-[9px] h-5 px-1.5`}>
                        {item.priority}
                    </span>
                    {item.amount && (
                      <span className="text-xs font-mono font-medium text-foreground/80">
                        {item.currency} {item.amount}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.customerName}
                  </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
