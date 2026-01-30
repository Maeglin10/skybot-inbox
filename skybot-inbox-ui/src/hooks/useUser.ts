import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  username: string;
  email?: string | null;
  name: string | null;
  role: 'ADMIN' | 'USER';
  accountId: string;
}

import { apiGetClient } from '@/lib/api.client';

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const data = await apiGetClient('/auth/me') as User;
      setUser(data);
    } catch (error: any) {
      console.error('Error fetching user:', error);
      // If 401, redirect to login (apiGetClient throws on error)
      if (error.message && error.message.includes('HTTP 401')) {
          router.push('/account/login');
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const isAdmin = user?.role === 'ADMIN';
  const isUser = user?.role === 'USER';

  return {
    user,
    loading,
    isAdmin,
    isUser,
    refetch: fetchUser,
  };
}
