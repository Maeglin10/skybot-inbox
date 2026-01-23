'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { 
  type AlertItem, 
  type AlertStatus, 
  fetchAlerts, 
  resolveAlert, 
  assignAlert 
} from '@/lib/adapters/alertsAdapter';
import { AlertList } from './alert-list';
import { AlertDetail } from './alert-detail';

// We reuse the 3-column specific class names from Inbox (ui-inboxHeader...)
// but we might need to adjust them if they are too specific in ui.css.
// Luckily ui.css definitions like .ui-inboxHeader are generic enough.

type Tab = 'PAYMENT' | 'HANDOFF';

export function AlertsShell() {
  const router = useRouter();
  const [tab, setTab] = React.useState<Tab>('PAYMENT');
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<AlertItem[]>([]);
  const [activeId, setActiveId] = React.useState<string | null>(null);

  // Load Alerts
  React.useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        const res = await fetchAlerts('OPEN', tab); // Only show OPEN/PENDING alerts primarily
        if (!active) return;
        setItems(res.items);
        
        // Auto-select first if none selected
        if (res.items.length > 0 && !activeId) {
           setActiveId(res.items[0].id);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [tab]); // activeId intentionally omitted to prevent re-select on every id change

  const activeItem = React.useMemo(() => 
    items.find(i => i.id === activeId) ?? null, 
  [items, activeId]);

  const handleResolve = async (id: string) => {
    // Optimistic update
    setItems(prev => prev.filter(i => i.id !== id));
    if (activeId === id) setActiveId(null);
    
    await resolveAlert(id);
  };

  const handleAssign = async (id: string) => {
    // Mock user ID assignment
    setItems(prev => prev.map(i => i.id === id ? { ...i, assignee: 'me' } : i));
    await assignAlert(id, 'me');
  };

  const TabBtn = ({ v, label }: { v: Tab; label: string }) => (
     <button
       type="button"
       onClick={() => { setTab(v); setActiveId(null); }}
       className={[
         'h-9 w-full rounded-md border border-border/20 px-3 text-xs font-medium transition-all',
         tab === v
           ? 'bg-muted text-foreground'
           : 'bg-transparent text-muted-foreground hover:bg-muted/50',
       ].join(' ')}
     >
       {label}
     </button>
   );

  return (
    <div className="h-[calc(100vh-1px)] w-full bg-transparent text-foreground">
      <div className="grid h-full grid-cols-[380px_minmax(0,1fr)]">
        
        {/* Middle Column: List */}
        <div className="border-r border-border/20 flex flex-col bg-background/50">
           {/* Header reusing Inbox header style */}
           <div className="ui-inboxHeader">
              <div className="ui-inboxHeader__top">
                <div className="ui-inboxHeader__title font-bold text-lg">Alerts</div>
                <div className="ui-inboxHeader__state text-xs text-muted-foreground uppercase tracking-wider font-semibold">
                   {tab}
                </div>
              </div>

              <div className="ui-inboxHeader__tabs">
                <TabBtn v="PAYMENT" label="Pending Payments" />
                <TabBtn v="HANDOFF" label="AI Handoff" />
              </div>
              
              {/* Optional Search */}
              <div className="ui-inboxHeader__search">
                 <input className="ui-input bg-muted/40" placeholder="Search alerts..." />
              </div>
           </div>

           <div className="flex-1 min-h-0 overflow-y-auto">
              {loading ? (
                 <div className="p-8 text-center text-sm text-muted-foreground animate-pulse">
                    Loading alerts...
                 </div>
              ) : (
                 <AlertList 
                    items={items} 
                    activeId={activeId} 
                    onSelect={setActiveId} 
                 />
              )}
           </div>
        </div>

        {/* Right Column: Detail */}
        <div className="min-w-0 bg-background/30">
           <AlertDetail 
              alert={activeItem} 
              onResolve={handleResolve}
              onAssign={handleAssign}
           />
        </div>

      </div>
    </div>
  );
}
