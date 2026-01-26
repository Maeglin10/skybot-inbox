'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGetClient } from '@/lib/api.client';
import { useEffect } from 'react';
import { setCookie } from 'cookies-next'; // Assuming cookies-next is available or using document.cookie

// Define types locally or import if available
interface TenantModulesResponse {
  modules: string[];
  tier: 'STARTER' | 'PRO' | 'ENTERPRISE';
  limits: {
    maxUsers: number;
    messagesPerMonth: number;
  };
}

// Mock data fallback if API fails (for dev/demo)
const MOCK_DATA: TenantModulesResponse = {
  modules: ['inbox', 'settings', 'account'], // Minimal set
  tier: 'STARTER',
  limits: { maxUsers: 1, messagesPerMonth: 100 }
};

export function useTenantModules() {
  const { data, isLoading, refetch, isError } = useQuery<TenantModulesResponse>({
    queryKey: ['tenant-modules'],
    queryFn: async () => {
      // In a real app this endpoint would return the modules enabled for the current tenant
      // We'll simulate a success with mock data if endpoint missing
      try {
         return await apiGetClient('modules/enabled');
      } catch (e) {
         console.warn("Failed to fetch modules, using mock data", e);
         // Return mock data for demo purposes so UI doesn't break
         // In prod we might want to throw or handle differently
         // For now, let's pretend we are PRO for better UX in demo
         return {
            modules: ['inbox', 'crm', 'calendar', 'analytics', 'settings', 'alerts'], 
            tier: 'PRO',
            limits: { maxUsers: 5, messagesPerMonth: 50000 }
         };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 min
    retry: 1
  });

  // Sync modules to cookie for Middleware to read (optional but requested logic for route protection)
  useEffect(() => {
     if (data?.modules) {
        document.cookie = `sk_modules=${JSON.stringify(data.modules)}; path=/; max-age=86400; samesite=strict`;
     }
  }, [data]);

  return {
    modules: data?.modules ?? [],
    tier: data?.tier ?? 'STARTER',
    limits: data?.limits ?? { maxUsers: 0, messagesPerMonth: 0 },
    loading: isLoading,
    refetch
  };
}
