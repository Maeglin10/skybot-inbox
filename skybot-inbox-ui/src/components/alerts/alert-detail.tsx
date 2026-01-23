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
import { Button } from '@/components/ui/button';

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
      <div className="p-6 border-b border-border">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-bold text-foreground">{alert.title}</h2>
          <div className="flex items-center gap-2">
             <Button
               variant="outline"
               size="sm"
               onClick={() => onAssign(alert.id)}
               className="h-9 border-border bg-background hover:bg-muted/10 text-muted-foreground hover:text-foreground"
             >
               <UserPlus size={14} className="mr-2" />
               {alert.assignee ? 'Reassign' : 'Assign'}
             </Button>
             
             {alert.status !== 'RESOLVED' && (
               <Button
                 size="sm"
                 onClick={() => onResolve(alert.id)}
                 className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground border-none"
               >
                 <CheckCircle2 size={14} className="mr-2" />
                 Resolve
               </Button>
             )}
          </div>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{alert.subtitle}</p>
        
        <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
           <div className="flex flex-col">
              <span className="mb-0.5">Customer</span>
              <span className="font-medium text-foreground">{alert.customerName}</span>
           </div>
           <div className="flex flex-col">
              <span className="mb-0.5">Received</span>
              <span className="font-medium text-foreground">{new Date(alert.createdAt).toLocaleString()}</span>
           </div>
           <div className="flex flex-col">
              <span className="mb-0.5">Channel</span>
              <span className="font-medium text-foreground">{alert.channel}</span>
           </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* Payment Details */}
        {alert.type === 'PAYMENT' && (
          <section className="rounded-lg border border-border p-4 bg-transparent">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/50">
               <CreditCard size={16} className="text-primary" /> 
               <span className="font-semibold text-sm">Transaction Details</span>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="text-xl font-bold text-foreground font-mono">
                    {alert.currency} {alert.amount?.toFixed(2)}
                  </div>
               </div>
               <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Invoice ID</div>
                  <div className="text-sm font-medium text-foreground">#INV-9921</div>
               </div>
               <div className="col-span-2 space-y-1">
                  <div className="text-xs text-muted-foreground">Failure Reason</div>
                  <div className="text-sm text-red-500">
                    Insufficient funds (Decline Code: 51)
                  </div>
               </div>
               
               <div className="col-span-2 pt-2">
                 <Button className="w-full h-9 bg-muted hover:bg-muted/80 text-foreground border border-border">
                    Retry Charge
                 </Button>
               </div>
            </div>
          </section>
        )}

        {/* Conversation Context */}
        <section className="rounded-lg border border-border p-4 bg-transparent">
           <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/50">
               <div className="flex items-center gap-2">
                   <MessageSquare size={16} className="text-primary" /> 
                   <span className="font-semibold text-sm">Conversation Context</span>
               </div>
               {alert.conversationId && (
                 <Link 
                    href={`/inbox/${alert.conversationId}`}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                 >
                   View Full <ArrowRight size={12} />
                 </Link>
               )}
           </div>
           
           <div className="space-y-4">
               <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Last User Message</div>
                  <div className="p-3 rounded bg-muted/20 border border-border/30 text-sm text-foreground">
                    "I don't understand why the payment didn't go through, can you check?"
                  </div>
               </div>
               
               <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">AI Response</div>
                  <div className="p-3 rounded bg-primary/5 border border-primary/20 text-sm text-foreground">
                     "I see that the transaction failed with code 51. This usually means insufficient funds."
                  </div>
               </div>
           </div>
        </section>

        {/* Activity Log (Mock) */}
        <section className="space-y-3">
           <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Internal Notes</h3>
           <div className="rounded-lg border border-border/50 p-4 min-h-[100px] text-sm text-muted-foreground">
              No internal notes yet.
           </div>
        </section>
      </div>
    </div>
  );
}
