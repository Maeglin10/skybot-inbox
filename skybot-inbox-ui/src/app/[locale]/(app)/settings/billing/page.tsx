'use client';

import { useTranslations } from '@/lib/translations';

export default function BillingPage() {
  const t = useTranslations('settings');
  
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">{t('billingTitle')}</h2>
          <p className="text-sm text-muted-foreground">{t('billingDescription')}</p>
       </div>
       <div className="ui-card p-8 text-center text-muted-foreground border-dashed">
          <p>{t('billingDemo')}</p>
       </div>
    </div>
  );
}
