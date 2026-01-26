<<<<<<< Updated upstream
export default function BillingPage() {
  return (
    <div className="space-y-6">
       <div>
          <h2 className="text-2xl font-bold mb-1">Billing</h2>
          <p className="text-sm text-muted-foreground">Manage your subscription and invoices.</p>
       </div>
       <div className="ui-card p-8 text-center text-muted-foreground border-dashed">
          <p>Billing module is not configured for this demo.</p>
=======
'use client';

import * as React from 'react';
import { useTranslations } from '@/lib/translations';
import { apiGetClient } from '@/lib/api.client';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';

export default function BillingPage() {
  const t = useTranslations('settings');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const handleManageBilling = async () => {
     setLoading(true);
     setError(null);
     try {
       const res = await apiGetClient('billing/portal');
       if(res.url) {
          window.location.href = res.url;
       } else {
          setError("No billing portal URL returned.");
       }
     } catch(err) {
       console.error(err);
       setError("Failed to redirect to billing portal.");
       setLoading(false);
     }
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">{t('billingTitle')}</h2>
          <p className="ui-pageSubtitle">{t('billingDescription')}</p>
       </div>
       
       <div className="ui-card">
          <div className="ui-card__body flex flex-col items-center justify-center p-12 text-center gap-4">
             <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard size={24} />
             </div>
             
             <div className="max-w-md space-y-2">
                <h3 className="text-lg font-semibold">Manage Subscription</h3>
                <p className="text-sm text-muted-foreground">
                   View your invoices, update payment methods, and manage your plan details safely in our payment partner's portal.
                </p>
             </div>

             {error && (
                <div className="text-sm text-red-500 bg-red-500/10 px-3 py-2 rounded-md">
                   {error}
                </div>
             )}

             <button 
               onClick={handleManageBilling} 
               disabled={loading}
               className="ui-btn ui-btn--primary mt-4 min-w-[160px] gap-2"
             >
                {loading ? (
                   <>
                      <Loader2 size={16} className="animate-spin" /> 
                      {t('loading')}
                   </>
                ) : (
                   <>
                      {t('billingTitle')} Portal
                      <ExternalLink size={14} />
                   </>
                )}
             </button>
          </div>
>>>>>>> Stashed changes
       </div>
    </div>
  );
}
