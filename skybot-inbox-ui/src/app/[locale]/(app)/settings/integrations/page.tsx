'use client';

import { useTranslations } from '@/lib/translations';

export default function IntegrationsPage() {
  const t = useTranslations('settings');

  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">{t('integrationsTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('integrationsDescription')}</p>
       </div>
       <div className="grid gap-4">
          {['Google Calendar', 'Airtable', 'Slack', 'Zapier'].map(app => (
             <div key={app} className="ui-card p-4 flex items-center justify-between">
                <span className="font-semibold">{app}</span>
                <button className="ui-btn h-8 text-xs">{t('connect')}</button>
             </div>
          ))}
       </div>
    </div>
  );
}
