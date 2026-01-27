'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { apiPostClient } from '@/lib/api.client';
import { OnboardingStepper } from '@/components/onboarding/stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MODULES = [
  { id: 'inbox', label: 'Inbox' },
  { id: 'crm', label: 'CRM' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'alerts', label: 'Alerts' },
];

export default function Step1TenantPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: '',
    tier: 'STARTER',
    modules: ['inbox'] // inbox default
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Direct API call
      const res: any = await apiPostClient('admin/tenants', formData);
      if (res && res.id) {
         // Persist tenantId for next steps via query param or store
         // For onboarding flow, query param is simple
         router.push(`step2-users?tenantId=${res.id}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to create tenant');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (modId: string) => {
    setFormData(prev => {
      const exists = prev.modules.includes(modId);
      return {
        ...prev,
        modules: exists 
          ? prev.modules.filter(m => m !== modId)
          : [...prev.modules, modId]
      };
    });
  };

  return (
    <div className="max-w-2xl mx-auto py-10">
      <OnboardingStepper currentStep={1} />
      
      <div className="ui-card p-6">
        <h1 className="text-xl font-bold mb-4">Create Organization</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Name</label>
            <Input 
              required
              placeholder="Acme Corp"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium">Subscription Tier</label>
             <div className="grid grid-cols-3 gap-2">
                {['STARTER', 'PRO', 'ENTERPRISE'].map(tier => (
                  <div 
                    key={tier}
                    onClick={() => setFormData({...formData, tier})}
                    className={`cursor-pointer border rounded-lg p-3 text-center transition-all ${formData.tier === tier ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted'}`}
                  >
                    <div className="text-sm font-bold">{tier}</div>
                  </div>
                ))}
             </div>
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium">Enabled Modules</label>
             <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {MODULES.map(mod => (
                  <div 
                    key={mod.id}
                    onClick={() => toggleModule(mod.id)}
                    className={`cursor-pointer border rounded-md p-2 flex items-center gap-2 transition-all ${formData.modules.includes(mod.id) ? 'border-primary bg-primary/5' : 'hover:bg-muted'}`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.modules.includes(mod.id) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                       {formData.modules.includes(mod.id) && <Check size={10} className="text-white" />}
                    </div>
                    <span className="text-sm">{mod.label}</span>
                  </div>
                ))}
             </div>
          </div>

          <div className="flex justify-end pt-4">
             <Button type="submit" disabled={loading}>
               {loading ? 'Creating...' : 'Next: Users'}
             </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Check({size, className}: {size: number, className: string}) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
  );
}
