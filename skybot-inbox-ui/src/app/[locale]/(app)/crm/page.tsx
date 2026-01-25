'use client';

import * as React from 'react';
import { fetchLeads, fetchFeedbacks } from '@/lib/adapters/crmAdapter';
import type { Lead, Feedback } from '@/lib/types/crm';
import { LeadsTable } from '@/components/crm/leads-table';
import { FeedbackTable } from '@/components/crm/feedback-table';
import { LeadDrawer } from '@/components/crm/lead-drawer';
import { FeedbackDrawer } from '@/components/crm/feedback-drawer';

export const dynamic = "force-dynamic";

type ViewMode = 'LEADS' | 'FEEDBACK';

export default function CrmPage() {
  const [view, setView] = React.useState<ViewMode>('LEADS');
  const [leads, setLeads] = React.useState<Lead[]>([]);
  const [feedbacks, setFeedbacks] = React.useState<Feedback[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Selection state
  const [selectedLead, setSelectedLead] = React.useState<Lead | null>(null);
  const [selectedFeedback, setSelectedFeedback] = React.useState<Feedback | null>(null);

  // Load Data
  React.useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [lRes, fRes] = await Promise.all([
          fetchLeads('ALL'),
          fetchFeedbacks()
        ]);
        setLeads(lRes.items);
        setFeedbacks(fRes.items);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectLead = (id: string) => {
    const l = leads.find(x => x.id === id) || null;
    setSelectedLead(l);
  };

  const handleSelectFeedback = (id: string) => {
    const f = feedbacks.find(x => x.id === id) || null;
    setSelectedFeedback(f);
  };

  const TabBtn = ({ mode, label }: { mode: ViewMode, label: string }) => (
    <button
      onClick={() => setView(mode)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        view === mode 
          ? 'bg-foreground text-background' 
          : 'text-muted-foreground hover:bg-muted'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="ui-page p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="ui-pageTitle">CRM</h1>
          <p className="ui-pageSubtitle mb-0">Manage your relationships and customer feedback.</p>
        </div>
        <div className="flex bg-muted/30 p-1 rounded-lg border border-border/20">
           <TabBtn mode="LEADS" label="Leads" />
           <TabBtn mode="FEEDBACK" label="Feedback" />
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground animate-pulse">
           Loading data...
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
           {view === 'LEADS' ? (
              <LeadsTable leads={leads} onSelect={handleSelectLead} />
           ) : (
              <FeedbackTable feedbacks={feedbacks} onSelect={handleSelectFeedback} />
           )}
        </div>
      )}

      {/* Drawers */}
      {selectedLead && (
         <div className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedLead(null)}>
            <div onClick={e => e.stopPropagation()}>
               <LeadDrawer lead={selectedLead} onClose={() => setSelectedLead(null)} />
            </div>
         </div>
      )}

      {selectedFeedback && (
         <div className="fixed inset-0 z-10 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedFeedback(null)}>
            <div onClick={e => e.stopPropagation()}>
               <FeedbackDrawer feedback={selectedFeedback} onClose={() => setSelectedFeedback(null)} />
            </div>
         </div>
      )}
    </div>
  );
}