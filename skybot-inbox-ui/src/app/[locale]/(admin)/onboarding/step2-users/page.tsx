'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { apiPostClient } from '@/lib/api.client';
import { OnboardingStepper } from '@/components/onboarding/stepper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, UserPlus } from 'lucide-react';

interface UserRow {
  email: string;
  role: 'ADMIN' | 'AGENT' | 'VIEWER';
  username: string;
}

export default function Step2UsersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [users, setUsers] = React.useState<UserRow[]>([{ email: '', username: '', role: 'ADMIN' }]);
  const [loading, setLoading] = React.useState(false);

  const addUserRow = () => {
    setUsers([...users, { email: '', username: '', role: 'AGENT' }]);
  };

  const removeUserRow = (idx: number) => {
    setUsers(users.filter((_, i) => i !== idx));
  };

  const updateRow = (idx: number, field: keyof UserRow, val: string) => {
     const next = [...users];
     next[idx] = { ...next[idx], [field]: val };
     setUsers(next);
  };

  const handleSubmit = async () => {
    if (!tenantId) return alert('No Tenant ID found');
    setLoading(true);

    try {
      // Process sequential requests or Promise.all
      // Assuming endpoint accepts array or single
      // Request requested: POST /api/admin/tenants/:id/users for each
      
      const validUsers = users.filter(u => u.email && u.username);
      
      await Promise.all(validUsers.map(u => 
         apiPostClient(`admin/tenants/${tenantId}/users`, u)
      ));
      
      router.push(`step3-integrations?tenantId=${tenantId}`);
    } catch (err) {
      console.error(err);
      alert('Failed to add users. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <OnboardingStepper currentStep={2} />
      
      <div className="ui-card p-6">
        <h1 className="text-xl font-bold mb-4">Add Initial Users</h1>
        
        <div className="space-y-4 mb-6">
           {users.map((row, idx) => (
             <div key={idx} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2">
                <div className="flex-1 space-y-1">
                   <Input 
                     placeholder="Username" 
                     value={row.username} 
                     onChange={e => updateRow(idx, 'username', e.target.value)} 
                   />
                </div>
                <div className="flex-1 space-y-1">
                   <Input 
                     placeholder="Email" 
                     value={row.email} 
                     onChange={e => updateRow(idx, 'email', e.target.value)} 
                   />
                </div>
                <div className="w-32 space-y-1">
                   <select 
                     className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                     value={row.role}
                     onChange={e => updateRow(idx, 'role', e.target.value as any)}
                   >
                     <option value="ADMIN">Admin</option>
                     <option value="AGENT">Agent</option>
                     <option value="VIEWER">Viewer</option>
                   </select>
                </div>
                
                {users.length > 1 && (
                  <Button variant="ghost" size="icon" onClick={() => removeUserRow(idx)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
                    <Trash2 size={16} />
                  </Button>
                )}
             </div>
           ))}

           <Button variant="outline" onClick={addUserRow} className="w-full border-dashed gap-2">
             <UserPlus size={16} /> Add User
           </Button>
        </div>

        <div className="flex justify-between pt-4 border-t">
           <Button variant="ghost" onClick={() => router.back()}>Back</Button>
           <Button onClick={handleSubmit} disabled={loading}>
             {loading ? 'Saving...' : 'Next: Integrations'}
           </Button>
        </div>
      </div>
    </div>
  );
}
