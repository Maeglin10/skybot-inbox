'use client';

import * as React from 'react';
import type { Lead } from '@/lib/types/crm';
import { X, User, Building, Mail, Phone, Calendar, Tag, Copy } from 'lucide-react';

export function LeadDrawer({
  lead,
  onClose
}: {
  lead: Lead | null;
  onClose: () => void;
}) {
  if (!lead) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[480px] bg-background/95 backdrop-blur-md border-l border-border/40 shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200">
      <div className="p-6 border-b border-border/30 flex items-start justify-between bg-muted/20">
        <div className="flex gap-4">
           <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary text-lg font-bold">
              {lead.name.slice(0, 2).toUpperCase()}
           </div>
           <div>
              <h2 className="text-lg font-bold leading-tight">{lead.name}</h2>
              {lead.company && <div className="text-sm text-muted-foreground flex items-center gap-1.5"><Building size={12}/> {lead.company}</div>}
              <div className="flex gap-2 mt-2">
                 <span className="ui-badge ui-badge--neutral text-[10px] uppercase tracking-wide">{lead.status}</span>
                 <span className="ui-badge ui-badge--warning text-[10px] uppercase tracking-wide">{lead.temperature}</span>
              </div>
           </div>
        </div>
        <button onClick={onClose} className="p-2 -mr-2 -mt-2 hover:bg-muted/50 rounded-full text-muted-foreground transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8">
        
        {/* Contact info */}
        <div className="space-y-4">
           <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Contact Information</h4>
           
           <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-muted/5 group">
                 <div className="flex items-center gap-3">
                    <Mail size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{lead.email || 'No email'}</span>
                 </div>
                 {lead.email && <button onClick={() => copyToClipboard(lead.email!)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded text-muted-foreground"><Copy size={12}/></button>}
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border/20 bg-muted/5 group">
                 <div className="flex items-center gap-3">
                    <Phone size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium">{lead.phone || 'No phone'}</span>
                 </div>
                 {lead.phone && <button onClick={() => copyToClipboard(lead.phone!)} className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-muted rounded text-muted-foreground"><Copy size={12}/></button>}
              </div>
           </div>
           
           <div className="text-xs text-muted-foreground flex items-center gap-2 mt-2">
              <Calendar size={12} />
              Created on {new Date(lead.createdAt).toLocaleDateString()}
           </div>
        </div>

        <div className="h-px bg-border/20 w-full" />

        {/* Tags */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Tags & Labels</h4>
          <div className="flex gap-2 flex-wrap">
             {lead.tags.map(t => (
               <span key={t} className="px-2.5 py-1 rounded-full bg-muted/50 text-[11px] font-medium border border-border/30 text-foreground/80">
                 {t}
               </span>
             ))}
             <button className="text-[11px] font-medium text-primary px-2.5 py-1 hover:bg-primary/10 rounded-full transition-colors">+ Add tag</button>
          </div>
        </div>
        
        <div className="h-px bg-border/20 w-full" />

        {/* Activity Timeline Stub */}
        <div>
           <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Activity Timeline</h4>
           <div className="border-l-2 border-border/30 pl-4 space-y-6 ml-1">
              <div className="relative group">
                 <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background group-hover:scale-110 transition-transform" />
                 <p className="text-sm font-medium">Lead Created</p>
                 <p className="text-xs text-muted-foreground mt-0.5">{new Date(lead.createdAt).toLocaleString()}</p>
              </div>
              <div className="relative group">
                 <div className="absolute -left-[23px] top-1.5 w-3 h-3 rounded-full bg-muted-foreground/30 ring-4 ring-background group-hover:bg-muted-foreground/50 transition-colors" />
                 <p className="text-sm font-medium">Last Interaction</p>
                 <p className="text-xs text-muted-foreground mt-0.5">Via {lead.channel} • {new Date(lead.lastInteractionAt).toLocaleString()}</p>
              </div>
           </div>
        </div>

      </div>
      
      {/* Footer Actions */}
      <div className="p-4 border-t border-border/30 bg-muted/10 flex justify-end gap-3">
         <button onClick={onClose} className="ui-btn bg-background text-sm">Close</button>
         <button className="ui-btn ui-btn--primary text-sm shadow-md">Start Conversation</button>
      </div>
    </div>
  );
}
