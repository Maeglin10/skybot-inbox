'use client';

import * as React from 'react';
import { apiGetClient, apiPostClient } from '@/lib/api.client';
import { ChevronsUpDown, Building } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'; // Assuming shadcn dropdown
import { Button } from '@/components/ui/button';

interface Tenant {
  id: string;
  name: string;
}

export function TenantSwitcher() {
  const [tenants, setTenants] = React.useState<Tenant[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [isAdmin, setIsAdmin] = React.useState(false);

  React.useEffect(() => {
    // Check if admin (simplified check, real app would check jwt claims or /users/me role)
    // We'll optimistically fetch if we think we might be admin, or just fetch and see if 403
    checkTenants();
  }, []);

  const checkTenants = async () => {
    try {
      // Mock admin check or real fetch
      // const me = await apiGetClient('users/me'); 
      // if (me.role !== 'SUPER_ADMIN') return;

      const res = await apiGetClient('admin/tenants');
      if (Array.isArray(res)) {
        setTenants(res);
        setIsAdmin(true);
      }
    } catch {
      // Ignore error, likely not admin
    }
  };

  const handleSwitch = async (tenantId: string) => {
    setLoading(true);
    // Set cookie via simple document interaction or API endpoint
    document.cookie = `tenant_id=${tenantId}; path=/; max-age=86400; samesite=strict`;
    
    // Hard reload to refresh all data context
    window.location.reload();
  };

  if (!isAdmin || tenants.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-full justify-between px-2 h-8 border border-border/50">
           <span className="flex items-center gap-2 truncate text-xs">
             <Building size={12} />
             Switch Tenant
           </span>
           <ChevronsUpDown size={12} className="opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>Available Tenants</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {tenants.map((t) => (
          <DropdownMenuItem key={t.id} onClick={() => handleSwitch(t.id)}>
             {t.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
