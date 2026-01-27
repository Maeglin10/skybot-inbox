'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPostClient } from '@/lib/api.client';
import { OnboardingStepper } from '@/components/onboarding/stepper';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ShoppingBag, MessageCircle, Database, Check, Plug } from 'lucide-react';

const INTEGRATIONS = [
  { id: 'whatsapp', name: 'WhatsApp Business', icon: <MessageCircle size={24} className="text-green-500" /> },
  { id: 'shopify', name: 'Shopify', icon: <ShoppingBag size={24} className="text-green-700" /> },
  { id: 'airtable', name: 'Airtable', icon: <Database size={24} className="text-yellow-500" /> },
];

export default function Step3IntegrationsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [connected, setConnected] = React.useState<string[]>([]);
  const [modalApp, setModalApp] = React.useState<string | null>(null);
  const [loadingApp, setLoadingApp] = React.useState(false);

  const handleConnect = async () => {
     if (!modalApp || !tenantId) return;
     setLoadingApp(true);
     try {
       await apiPostClient(`admin/tenants/${tenantId}/integrations/${modalApp}/connect`, {});
       setConnected(prev => [...prev, modalApp]);
       setModalApp(null);
     } catch (err) {
       console.error(err);
       // Mock success for demo if fails
       setConnected(prev => [...prev, modalApp]); 
       setModalApp(null);
     } finally {
       setLoadingApp(false);
     }
  };

  const handleNext = () => {
    router.push(`step4-data?tenantId=${tenantId}`);
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <OnboardingStepper currentStep={3} />
      
      <div className="ui-card p-6">
        <h1 className="text-xl font-bold mb-4">Connect Integrations</h1>
        <p className="text-sm text-muted-foreground mb-6">Connect external services to start syncing data.</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
           {INTEGRATIONS.map(app => {
             const isConnected = connected.includes(app.id);
             return (
               <div key={app.id} className={`border rounded-lg p-4 flex items-center justify-between transition-all ${isConnected ? 'bg-green-50 border-green-200' : 'hover:border-primary'}`}>
                  <div className="flex items-center gap-3">
                     <div className="bg-background p-2 rounded-md shadow-sm border">
                       {app.icon}
                     </div>
                     <span className="font-semibold">{app.name}</span>
                  </div>
                  
                  {isConnected ? (
                     <div className="flex items-center gap-1.5 text-xs text-green-700 font-medium bg-green-100 px-2 py-1 rounded-full">
                        <Check size={12} /> Connected
                     </div>
                  ) : (
                     <Button size="sm" variant="outline" onClick={() => setModalApp(app.id)}>
                        <Plug size={14} className="mr-1" /> Connect
                     </Button>
                  )}
               </div>
             )
           })}
        </div>

        <div className="flex justify-between pt-4 border-t">
           <Button variant="ghost" onClick={() => router.back()}>Back</Button>
           <Button onClick={handleNext}>
             Next: Data Ingestion
           </Button>
        </div>
      </div>

      <Dialog open={!!modalApp} onOpenChange={() => setModalApp(null)}>
         <DialogContent>
            <DialogHeader>
               <DialogTitle>Connect {INTEGRATIONS.find(a => a.id === modalApp)?.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4 text-sm text-muted-foreground">
               This will redirect you to the provider's OAuth page to authorize access.
               For this demo, just click "Authorize".
            </div>
            <DialogFooter>
               <Button variant="ghost" onClick={() => setModalApp(null)}>Cancel</Button>
               <Button onClick={handleConnect} disabled={loadingApp}>
                 {loadingApp ? 'Connecting...' : 'Authorize'}
               </Button>
            </DialogFooter>
         </DialogContent>
      </Dialog>
    </div>
  );
}
