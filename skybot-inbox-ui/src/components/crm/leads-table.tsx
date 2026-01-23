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
  let color = 'ui-badge--neutral';
  if (temp === 'HOT') color = 'ui-badge--danger';
  if (temp === 'WARM') color = 'ui-badge--warning';
  
  return (
    <span className={`ui-badge ${color} gap-1`}>
      <Thermometer size={12} />
      {temp}
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
    <div className="ui-card flex-1 flex flex-col">
      {/* Toolbar */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 p-4 border-b border-border/10 bg-muted/20">
         <div className="relative w-full lg:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               placeholder="Search leads..."
               className="ui-input h-9 pl-9 text-xs bg-background"
            />
         </div>
         <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Temperature:</span>
            {['ALL', 'HOT', 'WARM', 'COLD'].map(t => (
               <button
                  key={t}
                  onClick={() => setTempFilter(t)}
                  className={`px-3 py-1 text-[10px] font-medium rounded-full border transition-colors ${tempFilter === t ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-muted-foreground border-border/30 hover:border-border/60'}`}
               >
                  {t}
               </button>
            ))}
         </div>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="ui-table">
          <thead>
            <tr className="bg-muted/10">
              <th>Name / Company</th>
              <th>Status</th>
              <th>Temperature</th>
              <th>Channel</th>
              <th>Last Interaction</th>
              <th>Tags</th>
            </tr>
          </thead>
          <tbody>
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
                onClick={() => onSelect(lead.id)}
                className="cursor-pointer group hover:bg-muted/10"
              >
                <td className="align-middle">
                  <div className="font-semibold text-sm group-hover:text-primary transition-colors">{lead.name}</div>
                  {lead.company && <div className="text-xs text-muted-foreground">{lead.company}</div>}
                </td>
                <td className="align-middle">
                  <span className="ui-badge ui-badge--neutral text-[10px] uppercase tracking-wide">{lead.status}</span>
                </td>
                <td className="align-middle">
                   <TempBadge temp={lead.temperature} />
                </td>
                <td className="align-middle">
                   <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <ChannelIcon channel={lead.channel} />
                      <span className="capitalize text-xs hidden lg:inline">{lead.channel.toLowerCase()}</span>
                   </div>
                </td>
                <td className="align-middle text-xs text-muted-foreground">
                  {new Date(lead.lastInteractionAt).toLocaleDateString()}
                </td>
                <td className="align-middle">
                  <div className="flex gap-1 flex-wrap">
                    {lead.tags.map(tag => (
                      <span key={tag} className="text-[10px] bg-muted/50 px-1.5 py-0.5 rounded border border-border/20 text-muted-foreground">
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
      
      {/* Footer / Pagination Placeholder */}
      <div className="p-2 border-t border-border/10 text-xs text-muted-foreground text-center">
         Showing {filtered.length} of {leads.length} leads
      </div>
    </div>
  );
}
