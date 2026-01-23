'use client';

import * as React from 'react';
import type { Feedback } from '@/lib/types/crm';
import { X, MessageSquare, Quote, Copy, ExternalLink, Calendar } from 'lucide-react';

export function FeedbackDrawer({
  feedback,
  onClose
}: {
  feedback: Feedback | null;
  onClose: () => void;
}) {
  if (!feedback) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-background/95 backdrop-blur-md border-l border-border/40 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-6 border-b border-border/30 flex items-center justify-between bg-muted/20">
        <h2 className="text-lg font-bold">Feedback Details</h2>
        <button onClick={onClose} className="p-2 -mr-2 hover:bg-muted/50 rounded-full text-muted-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* RATING header */}
        <div className="text-center py-8 bg-gradient-to-br from-muted/50 to-muted/10 rounded-2xl border border-border/30 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50" />
           <div className="text-5xl font-bold text-amber-500 mb-2 tracking-tighter">{feedback.rating}<span className="text-2xl text-muted-foreground font-normal">/5</span></div>
           <div className="text-lg font-semibold">{feedback.customerName}</div>
           <div className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              Received via <span className="font-medium text-foreground">{feedback.channel}</span>
           </div>
        </div>

        {/* Content */}
        <div>
           <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              <Quote size={12} /> Full Review
           </h4>
           <div className="p-5 rounded-xl border border-border/40 bg-background shadow-sm text-sm leading-relaxed italic relative">
              <Quote className="absolute top-3 left-3 text-border/40 -scale-x-100" size={24} />
              <div className="relative z-10 pl-2">
                 "{feedback.fullText}"
              </div>
           </div>
        </div>
        
        <div className="h-px bg-border/20 w-full" />

        {/* Meta */}
        <div className="space-y-4">
           <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Metadata</h4>
           
           <div className="grid gap-2">
              <div className="flex justify-between items-center p-2 rounded hover:bg-muted/30">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar size={14} /> Date Received
                 </div>
                 <span className="text-sm font-medium">{new Date(feedback.createdAt).toLocaleDateString()}</span>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded hover:bg-muted/30">
                 <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare size={14} /> Snippet Preview
                 </div>
                 <span className="text-xs text-muted-foreground max-w-[200px] truncate">{feedback.snippet}</span>
              </div>

              {feedback.linkedLeadId && (
                 <div className="flex justify-between items-center p-2 rounded bg-primary/5 border border-primary/10 mt-2">
                    <span className="text-sm text-muted-foreground">Linked Lead Profile</span>
                    <button className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline">
                      View Lead <ExternalLink size={10} />
                    </button>
                 </div>
              )}
           </div>
        </div>

      </div>
      
      <div className="p-4 border-t border-border/30 bg-muted/5 flex justify-end">
         <button onClick={onClose} className="ui-btn text-sm w-full">Okay</button>
      </div>
    </div>
  );
}
