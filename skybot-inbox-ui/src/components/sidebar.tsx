'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/inbox', label: 'Inbox' },
  { href: '/alerts', label: 'Alertes' },
  { href: '/crm', label: 'Leads' },
  { href: '/settings', label: 'Settings' },
];

function isActive(pathname: string, href: string) {
  if (href === '/inbox') {
    return pathname === '/inbox' || pathname.startsWith('/inbox/');
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname() || '';

  return (
    <aside className="h-screen w-60 shrink-0 border-r border-white/10 bg-black flex flex-col">
      {/* Header */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="p-4 font-semibold text-[hsl(var(--primary))]">
          Nexxa Agent System
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 pt-6 space-y-3">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                'block rounded-lg px-4 py-3 text-sm transition-colors',
                active
                  ? 'bg-muted font-medium'
                  : 'hover:bg-muted',
              ].join(' ')}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-3 py-3 border-t border-white/10">
        <div className="text-xs text-white/40">V1</div>
      </div>
    </aside>
  );
}