'use client';

import { useTranslations } from '@/lib/translations';
import { CheckCircle2, Plus } from 'lucide-react';

/* 
  Mock Data for Integrations structure.
  In a real scenario, we might fetch 'installed' status from backend.
*/
const INTEGRATIONS = [
  { id: 'google_calendar', name: 'Google Calendar', icon: '📅', description: 'Sync events and meetings' },
  { id: 'airtable', name: 'Airtable', icon: '📊', description: 'Connect databases and rows' },
  { id: 'slack', name: 'Slack', icon: '💬', description: 'Notifications and alerts' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '📱', description: 'Messaging channel' },
];

export default function IntegrationsPage() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">{t('integrationsTitle')}</h2>
          <p className="ui-pageSubtitle">{t('manageIntegrationsDesc')}</p>
       </div>
       
       <div className="grid gap-4">
          {INTEGRATIONS.map(app => (
             <div key={app.id} className="ui-card p-5 flex items-center justify-between transition-all hover:border-primary/50">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center text-xl shadow-sm">
                      {app.icon}
                   </div>
                   <div>
                      <h3 className="font-semibold text-sm">{app.name}</h3>
                      <p className="text-xs text-muted-foreground">{app.description}</p>
                   </div>
                </div>
                
                {/* 
                   For now, visual only as requested. 
                   Logic would key off 'isConnected' prop in future.
                */}
                <button className="ui-btn ui-btn--secondary h-8 text-xs gap-2">
                   <Plus size={14} />
                   {t('connect')}
                </button>
             </div>
          ))}
       </div>
    </div>
  );
}
