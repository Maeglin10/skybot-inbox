'use client';

import * as React from 'react';
import { useTranslations } from '@/lib/translations';
import { apiPostClient } from '@/lib/api.client';
import { CreditCard, ExternalLink, Loader2 } from 'lucide-react';

export default function BillingPage() {
  const t = useTranslations('settings');
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  
  const handlePortal = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // POST to billing portal as requested
      const res: any = await apiPostClient('billing/portal', {});
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        // Fallback message if url is missing (e.g. not configured on backend)
        setMessage("La facturación estará disponible próximamente.");
      }
    } catch (err) {
      console.error(err);
      setMessage("La facturación estará disponible próximamente.");
    } finally {
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
                <h3 className="text-lg font-semibold">Gestión de Suscripción</h3>
                <p className="text-sm text-muted-foreground">
                   Consulta tus facturas y gestiona tu plan de forma segura.
                </p>
             </div>

             {message && (
               <div className="text-sm text-muted-foreground bg-muted px-4 py-2 rounded-md">
                 {message}
               </div>
             )}

             <button 
               onClick={handlePortal}
               disabled={loading}
               className="ui-btn ui-btn--primary min-w-[150px] gap-2 mt-4"
             >
                {loading && <Loader2 size={16} className="animate-spin" />}
                <span>Portal de Facturación</span>
                <ExternalLink size={14} />
             </button>
          </div>
       </div>
    </div>
  );
}
