'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiGetClient } from '@/lib/api.client';
import { OnboardingStepper } from '@/components/onboarding/stepper';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Activity, ShieldCheck, Database } from 'lucide-react';

export default function Step5HealthPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');
  const [health, setHealth] = React.useState<any>(null);

  React.useEffect(() => {
     if(tenantId) {
        // Mock checking health
        setTimeout(() => {
           setHealth({
              api: 'operational',
              db: 'operational',
              integrations: 'operational',
              search: 'indexing'
           });
        }, 1500);
     }
  }, [tenantId]);

  const handleComplete = () => {
    // Redirect to billing or dashboard main list
    router.push('/settings/billing'); 
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <OnboardingStepper currentStep={5} />
      
      <div className="ui-card p-6 text-center">
        <h1 className="text-xl font-bold mb-4">System Health Check</h1>
        <p className="text-sm text-muted-foreground mb-8">Verifying tenant provisioning status...</p>
        
        {!health ? (
           <div className="py-12 flex flex-col items-center">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <div className="text-sm text-muted-foreground">Running diagnostics...</div>
           </div>
        ) : (
           <div className="grid grid-cols-2 gap-4 mb-8">
              <HealthCard label="API Gateway" status={health.api} icon={<Activity />} />
              <HealthCard label="Database" status={health.db} icon={<Database />} />
              <HealthCard label="Integrations" status={health.integrations} icon={<PlugIcon />} />
              <HealthCard label="Indexing" status={health.search} icon={<ShieldCheck />} />
           </div>
        )}

        {health && (
          <div className="animate-in fade-in zoom-in duration-500">
             <div className="bg-green-100 text-green-800 p-4 rounded-lg mb-6 flex items-center justify-center gap-2">
                <CheckCircle2 />
                <span className="font-semibold">Tenant successfully provisioned!</span>
             </div>
             
             <Button onClick={handleComplete} size="lg" className="w-full sm:w-auto">
               Go to Dashboard
             </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function HealthCard({ label, status, icon }: any) {
   const isOk = status === 'operational';
   return (
      <div className="border rounded-lg p-4 flex flex-col items-center gap-2">
         <div className={`p-2 rounded-full ${isOk ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
            {icon}
         </div>
         <div className="font-medium text-sm">{label}</div>
         <div className="text-xs uppercase tracking-wider text-muted-foreground">{status}</div>
      </div>
   );
}

function PlugIcon() {
   return (
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/></svg>
   )
}
