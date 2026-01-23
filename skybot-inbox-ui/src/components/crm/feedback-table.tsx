'use client';

import * as React from 'react';
import type { Feedback } from '@/lib/types/crm';
import { Star, MessageCircle, Mail, Globe, Phone, Search } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/loading-skeletons';

function ChannelIcon({ channel }: { channel: string }) {
  if (channel === 'WHATSAPP') return <MessageCircle size={16} className="text-green-500" />;
  if (channel === 'EMAIL') return <Mail size={16} className="text-blue-500" />;
  if (channel === 'INSTAGRAM') return <Globe size={16} className="text-pink-500" />;
  return <Phone size={16} />;
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex text-amber-400">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={12} fill={i <= rating ? "currentColor" : "transparent"} strokeWidth={i <= rating ? 0 : 2} className={i <= rating ? "" : "text-muted-foreground opacity-30"} />
      ))}
    </div>
  );
}

export function FeedbackTable({ 
  feedbacks, 
  onSelect,
  loading = false
}: { 
  feedbacks: Feedback[]; 
  onSelect: (id: string) => void;
  loading?: boolean;
}) {
  const [ratingFilter, setRatingFilter] = React.useState<number | null>(null);

  const filtered = React.useMemo(() => {
     if (ratingFilter === null) return feedbacks;
     return feedbacks.filter(f => f.rating === ratingFilter);
  }, [feedbacks, ratingFilter]);

  if (loading) return <TableSkeleton rows={8} />;

  if (feedbacks.length === 0) return <EmptyState title="No feedback" description="No customer feedback has been collected yet." />;

  return (
    <div className="ui-card flex-1 flex flex-col">
       {/* Toolbar */}
      <div className="flex items-center gap-4 p-4 border-b border-border/10 bg-muted/20">
         <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Filter by Rating:</span>
         <div className="flex gap-1">
             <button 
                onClick={() => setRatingFilter(null)}
                className={`px-3 py-1 text-[10px] font-medium rounded-full border transition-all ${ratingFilter === null ? 'bg-foreground text-background border-foreground' : 'bg-transparent text-muted-foreground border-border/30 hover:border-border/60'}`}
             >
               All
             </button>
             {[5, 4, 3, 2, 1].map(r => (
                <button
                  key={r}
                  onClick={() => setRatingFilter(r)}
                  className={`px-2 py-1 flex items-center gap-1 text-[10px] font-medium rounded-full border transition-all ${ratingFilter === r ? 'bg-amber-500/10 text-amber-500 border-amber-500' : 'bg-transparent text-muted-foreground border-border/30 hover:border-border/60'}`}
                >
                  {r} <Star size={8} fill="currentColor" />
                </button>
             ))}
         </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="ui-table">
          <thead>
            <tr className="bg-muted/10">
              <th>Customer</th>
              <th>Rating</th>
              <th>Channel</th>
              <th>Feedback Snippet</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
               <tr>
                 <td colSpan={5} className="h-48 text-center text-muted-foreground">
                    No results for this filter.
                 </td>
               </tr>
            )}
            {filtered.map((fb) => (
              <tr 
                key={fb.id} 
                onClick={() => onSelect(fb.id)}
                className="cursor-pointer hover:bg-muted/10 group"
              >
                <td className="align-middle font-medium text-sm group-hover:text-primary transition-colors">
                  {fb.customerName}
                </td>
                <td className="align-middle">
                  <RatingStars rating={fb.rating} />
                </td>
                <td className="align-middle">
                   <div className="flex items-center gap-2 text-sm text-foreground/80">
                      <ChannelIcon channel={fb.channel} />
                   </div>
                </td>
                <td className="align-middle">
                  <div className="text-sm truncate max-w-[320px] text-muted-foreground italic">"{fb.snippet}"</div>
                </td>
                <td className="align-middle text-xs text-muted-foreground">
                  {new Date(fb.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
