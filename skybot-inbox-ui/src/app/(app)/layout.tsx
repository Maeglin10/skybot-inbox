import type { ReactNode } from 'react';
import { Sidebar } from '@/components/sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="ui-app">
      <Sidebar />
      <main className="ui-main">{children}</main>
    </div>
  );
}