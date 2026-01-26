'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleGuardProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'USER';
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  children,
  requiredRole = 'ADMIN',
  fallback = null,
  redirectTo,
}: RoleGuardProps) {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Check if user has required role
      if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
        if (redirectTo) {
          router.push(redirectTo);
        }
      }
    }
  }, [user, loading, requiredRole, redirectTo, router]);

  // Show loading state
  if (loading) {
    return null;
  }

  // User not authenticated (will be redirected by useUser hook)
  if (!user) {
    return fallback;
  }

  // Check role permission
  if (requiredRole === 'ADMIN' && user.role !== 'ADMIN') {
    return fallback;
  }

  return <>{children}</>;
}
