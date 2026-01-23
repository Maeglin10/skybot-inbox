'use client';

import * as React from 'react';
import type { AlertItem } from '@/lib/adapters/alertsAdapter';
import { 
  CheckCircle2, 
  UserPlus, 
  MessageSquare, 
  CreditCard, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export function AlertDetail({
  alert,
  onResolve,
  onAssign
}: {
  alert: AlertItem | null;
  onResolve: (id: string) => void;
  onAssign: (id: string) => void;
}) {
  if (!alert) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <ShieldAlert size={48} className="mb-4 opacity-20" />
        <p>Select an alert to view details</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background/50 backdrop-blur-sm">
      {/* Header */}
      <div className="p-6 border-b border-border/40">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-foreground">{alert.title}</h2>
          <div className="flex items-center gap-2">
             <button
               onClick={() => onAssign(alert.id)}
               className="ui-btn flex items-center gap-2 text-xs h-8"
             >
               <UserPlus size={14} />
               {alert.assignee ? 'Reassign' : 'Assign'}
             </button>
             {alert.status !== 'RESOLVED' && (
               <button
                 onClick={() => onResolve(alert.id)}
                 className="ui-btn ui-btn--primary flex items-center gap-2 text-xs h-8"
               >
                 <CheckCircle2 size={14} />
                 Resolve
               </button>
             )}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{alert.subtitle}</p>
        
        <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
           <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Customer:</span> {alert.customerName}
           </div>
           <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Received:</span> {new Date(alert.createdAt).toLocaleString()}
           </div>
           <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Channel:</span> {alert.channel}
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Payment Details if applicable */}
        {alert.type === 'PAYMENT' && (
          <section className="ui-card">
            <div className="ui-card__header">
               <span className="ui-card__title flex items-center gap-2">
                 <CreditCard size={16} /> Transaction Details
               </span>
            </div>
            <div className="ui-card__body grid grid-cols-2 gap-4">
               <div>
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="text-lg font-bold text-foreground font-mono">
                    {alert.currency} {alert.amount?.toFixed(2)}
                  </div>
               </div>
               <div>
                  <div className="text-xs text-muted-foreground">Invoice ID</div>
                  <div className="text-sm font-medium text-foreground">#INV-9921</div>
               </div>
               <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Failure Reason</div>
                  <div className="text-sm text-red-400 mt-1">
                    Insufficient funds (Decline Code: 51)
                  </div>
               </div>
            </div>
            <div className="p-3 bg-muted/20 border-t border-border/20 flex gap-2">
               <button className="ui-btn text-xs w-full">Retry Charge</button>
               <button className="ui-btn text-xs w-full">Mark Paid</button>
            </div>
          </section>
        )}

        {/* Conversation Link & Summary */}
        <section className="ui-card">
           <div className="ui-card__header">
              <span className="ui-card__title flex items-center gap-2">
                <MessageSquare size={16} /> Conversation Context
              </span>
              {alert.conversationId && (
                <Link 
                   href={`/inbox/${alert.conversationId}`}
                   className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  Go to Inbox <ArrowRight size={12} />
                </Link>
              )}
           </div>
           <div className="ui-card__body space-y-3 text-sm">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Last message from user:</span>
                {" "}"I tried to update my card but it keeps giving me an error. Can you help me fix this so I don't lose access?"
              </p>
              
              <div className="bg-muted/30 p-3 rounded-md text-xs text-muted-foreground">
                 AI attempted to send "Update Payment Link" but api returned 400.
              </div>
           </div>
        </section>

        {/* Activity Log (Mock) */}
        <section>
          <div className="ui-pageSubtitle mb-2">Internal Notes & Logs</div>
          <div className="border border-border/30 rounded-lg p-4 space-y-4">
             <div className="flex gap-3 text-xs">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">SY</div>
                <div>
                   <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">System</span>
                      <span className="text-muted-foreground">2 hours ago</span>
                   </div>
                   <p className="mt-1 text-muted-foreground">Alert triggered by workflow "Payment Retry Failed".</p>
                </div>
             </div>
             {alert.assignee && (
                <div className="flex gap-3 text-xs">
                   <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold">AD</div>
                   <div>
                      <div className="flex items-center gap-2">
                         <span className="font-semibold text-foreground">Admin</span>
                         <span className="text-muted-foreground">Just now</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">Assigned to current user.</p>
                   </div>
                </div>
             )}
          </div>
          
          <div className="mt-3 flex gap-2">
             <input className="ui-input h-9 text-xs" placeholder="Add a note..." />
             <button className="ui-btn h-9 text-xs">Post</button>
          </div>
        </section>

      </div>
    </div>
  );
}
