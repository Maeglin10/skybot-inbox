import type { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-full bg-green-600 text-white">
      <div className="flex h-full w-full">
        <Sidebar />
        <main className="min-w-0 flex-1 h-full">{children}</main>
      </div>
    </div>
  );
}
