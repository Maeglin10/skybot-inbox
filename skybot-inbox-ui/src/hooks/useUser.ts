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

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch('/api/proxy/auth/me', {
        credentials: 'include',
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, redirect to login
          router.push('/account/login');
          return;
        }
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Error fetching user:', error);
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
