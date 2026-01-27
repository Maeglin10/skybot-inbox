'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/translations';
import { apiGetClient } from '@/lib/api.client';
import { CreditCard, PlusCircle, Loader2 } from 'lucide-react';
import { useTenantModules } from '@/hooks/use-tenant-modules';
import { TenantBadge } from '@/components/tenant-badge';
import { StatusBadge } from '@/components/status-badge';
import { ModuleCard } from '@/components/module-card';
import { Button } from '@/components/ui/button';

// Map known modules to display names
const MODULE_INFO: Record<string, { title: string, desc: string }> = {
  inbox: { title: 'Unified Inbox', desc: 'Centralize all messaging channels.' },
  crm: { title: 'CRM', desc: 'Manage customers and leads efficiently.' },
  analytics: { title: 'Analytics', desc: 'Insights and performance metrics.' },
  calendar: { title: 'Calendar', desc: 'Scheduling and event management.' },
  alerts: { title: 'Alerts', desc: 'Real-time notifications system.' },
};

export default function BillingPage() {
  const router = useRouter();
  const t = useTranslations('settings');
  const { modules, tier, limits, loading: modulesLoading } = useTenantModules();

  const [portalLoading, setPortalLoading] = React.useState(false);

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await apiGetClient('billing/portal');
      if (res && res.url) {
        window.location.href = res.url;
      } else {
        alert("Billing portal currently unavailable (Mock).");
      }
    } catch {
      alert("Failed to redirect to billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleAddModules = () => {
     router.push('/billing/checkout');
  };

  if (modulesLoading) {
     return <div className="p-10 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-8 pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="ui-pageTitle">{t('billingTitle')}</h2>
            <p className="ui-pageSubtitle">{t('billingDescription')}</p>
          </div>
          <div className="flex gap-2">
             <Button variant="outline" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Manage Subscription
             </Button>
          </div>
       </div>

       {/* High Level Status */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="ui-card p-6 flex flex-col justify-between">
             <div className="text-sm font-medium text-muted-foreground mb-2">Current Plan</div>
             <div className="flex items-center gap-3 mb-1">
                <span className="text-2xl font-bold">{tier}</span>
                <TenantBadge tier={tier as any} />
             </div>
             <div className="text-xs text-muted-foreground mt-2">
                Billed monthly
             </div>
          </div>

          <div className="ui-card p-6 flex flex-col justify-between">
             <div className="text-sm font-medium text-muted-foreground mb-2">Account Status</div>
             <div className="flex items-center gap-2 mb-1">
                <StatusBadge status="ACTIVE" />
             </div>
             <div className="text-xs text-muted-foreground mt-2">
                Next billing date: Feb 28, 2026
             </div>
          </div>

          <div className="ui-card p-6 flex flex-col justify-between bg-primary/5 border-primary/20">
             <div className="text-sm font-medium text-primary mb-2">Messages Usage</div>
             <div>
                <div className="flex justify-between text-sm mb-1.5">
                   <span className="font-bold">1,240</span>
                   <span className="text-muted-foreground">/ {limits.messagesPerMonth}</span>
                </div>
                <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                   <div className="h-full bg-primary" style={{ width: `${Math.min((1240 / (limits.messagesPerMonth || 1)) * 100, 100)}%` }} />
                </div>
             </div>
             <div className="text-xs text-muted-foreground mt-2">
                Resets in 14 days
             </div>
          </div>
       </div>

       {/* Active Modules Grid */}
       <div>
          <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-semibold">Enabled Modules</h3>
             <Button size="sm" onClick={handleAddModules} className="gap-2">
               <PlusCircle size={16} /> Add Modules
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {Object.entries(MODULE_INFO).map(([key, info]) => {
                const isEnabled = modules.includes(key);
                return (
                   <div key={key} className="h-full">
                      <ModuleCard
                         moduleKey={key}
                         title={info.title}
                         description={info.desc}
                         enabled={isEnabled}
                         locked={!isEnabled}
                         usagePct={isEnabled ? Math.random() * 80 : undefined}
                         onUpgrade={!isEnabled ? handleAddModules : undefined}
                         onConfigure={isEnabled ? () => router.push(`/${key}`) : undefined}
                      />
                   </div>
                );
             })}
          </div>
       </div>

       {/* Payment Method Stub */}
       <div className="ui-card">
          <div className="ui-card__header">
             <div className="flex items-center gap-2">
                <CreditCard size={18} />
                <span className="font-semibold">Payment Method</span>
             </div>
          </div>
          <div className="ui-card__body flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-6 bg-slate-800 rounded border border-slate-600 relative overflow-hidden">
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] text-white font-bold tracking-widest">VISA</div>
                </div>
                <div className="flex flex-col">
                   <span className="text-sm font-medium">Card ending in 4242</span>
                   <span className="text-xs text-muted-foreground">Expires 12/2028</span>
                </div>
             </div>

             <Button variant="ghost" size="sm" onClick={handlePortal}>
                Update
             </Button>
          </div>
       </div>
    </div>
  );
}
