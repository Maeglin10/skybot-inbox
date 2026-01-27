'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { apiPostClient } from '@/lib/api.client';
import { useTenantModules } from '@/hooks/use-tenant-modules';
import { Button } from '@/components/ui/button';
import { Check, ArrowLeft, ShieldCheck, Loader2 } from 'lucide-react';

const AVAILABLE_ADDONS = [
  { id: 'crm', name: 'CRM Pro', price: 2900, desc: 'Advanced customer tracking & pipelines' },
  { id: 'analytics', name: 'Analytics Plus', price: 1900, desc: 'Custom reports & dashboards' },
  { id: 'alerts', name: 'Real-time Alerts', price: 1500, desc: 'Instant SMS & Email notifications' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { modules, loading: modulesLoading } = useTenantModules();
  
  const [selected, setSelected] = React.useState<string[]>([]);
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);

  const toggle = (id: string) => {
    setSelected(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const total = selected.reduce((acc, id) => {
     const item = AVAILABLE_ADDONS.find(a => a.id === id);
     return acc + (item?.price || 0);
  }, 0);

  const handleProceed = async () => {
    if(selected.length === 0) return;
    setCheckoutLoading(true);
    try {
       const res: any = await apiPostClient('billing/checkout-session', {
          items: selected.map(id => ({ priceId: `price_${id}`, quantity: 1 }))
       });

       if (res && res.url) {
          window.location.href = res.url;
       } else {
          // Fallback if no specific URL returned (mock environment)
          setTimeout(() => {
             alert('Simulated Checkout Success (Demo Mode)');
             router.push('/settings/billing');
          }, 800);
       }
    } catch (err) {
       console.error(err);
       alert('Checkout flow failed to initialize.');
    } finally {
       setCheckoutLoading(false);
    }
  };

  if (modulesLoading) return <div className="p-20 text-center"><Loader2 className="animate-spin inline mr-2"/>Loading modules...</div>;

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="mb-8">
         <button onClick={() => router.back()} className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground mb-4">
            <ArrowLeft size={14} /> Back to Billing
         </button>
         <h1 className="text-3xl font-bold">Customize your plan</h1>
         <p className="text-muted-foreground mt-2">Add powerful modules to enhance your workflow.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Selection List */}
         <div className="lg:col-span-2 space-y-4">
            {AVAILABLE_ADDONS.map(addon => {
               const alreadyOwned = modules.includes(addon.id);
               const isSelected = selected.includes(addon.id);

               return (
                  <div 
                    key={addon.id}
                    onClick={() => !alreadyOwned && toggle(addon.id)}
                    className={`
                       relative border rounded-xl p-6 transition-all cursor-pointer
                       ${alreadyOwned ? 'bg-muted/50 border-muted opacity-80 cursor-default' : ''}
                       ${isSelected && !alreadyOwned ? 'border-primary ring-1 ring-primary bg-primary/5' : 'hover:border-primary/50'}
                    `}
                  >
                     <div className="flex justify-between items-start">
                        <div>
                           <h3 className="font-semibold text-lg flex items-center gap-2">
                              {addon.name}
                              {alreadyOwned && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Owned</span>}
                           </h3>
                           <p className="text-sm text-muted-foreground mt-1">{addon.desc}</p>
                        </div>
                        <div className="font-medium">
                           ${(addon.price / 100).toFixed(2)}<span className="text-xs text-muted-foreground">/mo</span>
                        </div>
                     </div>
                     
                     {isSelected && (
                        <div className="absolute top-4 right-4 text-primary">
                           <Check size={20} />
                        </div>
                     )}
                  </div>
               );
            })}
         </div>

         {/* Summary Panel */}
         <div className="lg:col-span-1">
            <div className="ui-card p-6 sticky top-6">
               <h3 className="font-semibold mb-4">Summary</h3>
               
               <div className="space-y-3 mb-6">
                  {selected.length === 0 ? (
                     <div className="text-sm text-muted-foreground italic">No add-ons selected</div>
                  ) : (
                     selected.map(id => {
                        const item = AVAILABLE_ADDONS.find(a => a.id === id);
                        return (
                           <div key={id} className="flex justify-between text-sm">
                              <span>{item?.name}</span>
                              <span>${((item?.price || 0) / 100).toFixed(2)}</span>
                           </div>
                        );
                     })
                  )}
                  
                  <div className="border-t border-border pt-3 mt-3 flex justify-between font-bold">
                     <span>Total Monthly</span>
                     <span>${(total / 100).toFixed(2)}</span>
                  </div>
               </div>

               <div className="bg-muted/50 rounded p-3 text-xs text-muted-foreground mb-6 flex gap-2">
                  <ShieldCheck size={24} className="flex-shrink-0 text-green-600" />
                  <div>
                     Secure checkout via Stripe. Cancel anytime.
                  </div>
               </div>

               <Button 
                 onClick={handleProceed} 
                 disabled={selected.length === 0 || checkoutLoading} 
                 className="w-full" 
                 size="lg"
               >
                  {checkoutLoading && <Loader2 className="animate-spin mr-2" />}
                  Proceed to Checkout
               </Button>
            </div>
         </div>
      </div>
    </div>
  );
}
