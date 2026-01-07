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
    <aside className="h-screen w-64 shrink-0 border-r border-white/10 bg-black">
      {/* Top */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center">
            <img src="/logo.svg" alt="Nexxa" className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="text-sm font-semibold text-[hsl(var(--primary))] truncate">
              Nexxa
            </div>
            <div className="text-xs text-white/40 truncate">Agent Inbox</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="px-3 py-4 space-y-1">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                'flex items-center rounded-lg px-3 py-2 text-sm',
                'transition-colors',
                active
                  ? 'bg-white/10 text-white'
                  : 'text-white/70 hover:bg-white/5 hover:text-white',
              ].join(' ')}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer sticky */}
      <div className="mt-auto px-4 py-3 border-t border-white/10">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>V1</span>
          <span className="text-white/30">Nexxa</span>
        </div>
      </div>
    </aside>
  );
}
