'use client';

import * as React from 'react';
import type { Lead } from '@/lib/types/crm';
import { Badge, Thermometer, Mail, MessageCircle, Phone, Globe, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeletons';

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'WHATSAPP') return <MessageCircle size={16} className="text-green-500" />;
  if (channel === 'EMAIL') return <Mail size={16} className="text-blue-500" />;
  if (channel === 'INSTAGRAM') return <Globe size={16} className="text-pink-500" />;
  return <Phone size={16} />;
}

function TempBadge({ temp }: { temp: string }) {
  let colorClass = 'bg-muted/30 text-muted-foreground border-transparent';
  
  if (temp === 'HOT') colorClass = 'bg-red-500/10 text-red-400 border-red-500/20';
  if (temp === 'WARM') colorClass = 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  if (temp === 'COLD') colorClass = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase ${colorClass}`}>
      <Thermometer size={10} />
      {temp}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
    const s = status.toUpperCase();
    if (['WON', 'QUALIFIED'].includes(s)) {
        return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#9E398D' }}>
                {status}
            </span>
        );
    }
    if (['LOST', 'CONTACTED'].includes(s)) {
        return (
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-transparent border text-[#939AA1]" style={{ borderColor: '#939AA1' }}>
                {status}
            </span>
        );
    }
    return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted/30 text-muted-foreground">
            {status}
        </span>
    );
}

export function LeadsTable({ 
  leads, 
  onSelect,
  loading = false
}: { 
  leads: Lead[]; 
  onSelect: (id: string) => void;
  loading?: boolean;
}) {
  const [filter, setFilter] = React.useState('');
  const [tempFilter, setTempFilter] = React.useState<string>('ALL');

  const filtered = React.useMemo(() => {
     return leads.filter(l => {
        const matchesText = l.name.toLowerCase().includes(filter.toLowerCase()) || 
                            l.company?.toLowerCase().includes(filter.toLowerCase());
        const matchesTemp = tempFilter === 'ALL' || l.temperature === tempFilter;
        return matchesText && matchesTemp;
     });
  }, [leads, filter, tempFilter]);

  if (loading) return <TableSkeleton rows={8} />;

  if (leads.length === 0) return <EmptyState title="No leads found" description="You haven't added any leads yet." />;

  return (
    <div className="ui-card flex-1 flex flex-col bg-transparent border-none">
      {/* Toolbar */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 py-4 mb-2">
         <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               placeholder="Search leads..."
               className="ui-input h-9 pl-9 text-xs bg-muted/10 border-border rounded-md w-full focus:border-primary transition-colors outline-none"
            />
         </div>
         <div className="flex items-center gap-2">
            {['ALL', 'HOT', 'WARM', 'COLD'].map(t => (
               <button
                  key={t}
                  onClick={() => setTempFilter(t)}
                  className={`
                    px-4 py-1.5 text-[11px] font-medium rounded-full border transition-all
                    ${tempFilter === t 
                        ? 'bg-muted text-foreground border-border' // Active: Dark Violet bg
                        : 'bg-transparent text-muted-foreground border-transparent hover:bg-muted/20'
                    }
                  `}
               >
                  {t}
               </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-x-auto rounded-lg border border-border bg-background/20">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-border/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <th className="p-4 font-medium">Name / Company</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Temperature</th>
              <th className="p-4 font-medium">Channel</th>
              <th className="p-4 font-medium text-left">Last Interaction</th>
              <th className="p-4 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="h-64">
                   <EmptyState 
                      heightClass="h-full border-none bg-transparent" 
                      title="No results found" 
                      description="Try adjusting your search or filters." 
                   />
                </td>
              </tr>
            )}
            {filtered.map((lead) => (
              <tr 
                key={lead.id} 
                className="group border-b border-white/10 hover:bg-muted/20 cursor-pointer transition-colors last:border-0"
                onClick={() => onSelect(lead.id)}
              >
                <td className="p-4">
                  <div className="font-medium text-foreground">{lead.name}</div>
                  {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                </td>
                <td className="p-4">
                  <StatusBadge status={lead.status} />
                </td>
                <td className="p-4">
                   <TempBadge temp={lead.temperature} />
                </td>
                <td className="p-4 text-muted-foreground">
                   <div className="flex items-center gap-2 text-xs">
                     <ChannelIcon channel={lead.channel} />
                     {lead.channel}
                   </div>
                </td>
                <td className="p-4 text-xs text-muted-foreground text-left font-mono">
                   {new Date(lead.lastInteractionAt).toLocaleDateString()}
                </td>
                <td className="p-4">
                  <div className="flex gap-1 flex-wrap">
                    {lead.tags.slice(0, 2).map(tag => (
                      <span key={tag} className="text-[10px] bg-muted/30 px-1.5 py-0.5 rounded text-muted-foreground border border-white/5">
                        {tag}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
