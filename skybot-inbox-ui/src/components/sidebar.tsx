'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Inbox, 
  Bell, 
  Users, 
  BarChart3, 
  Settings, 
  LayoutDashboard,
  Calendar,
  User
} from 'lucide-react';

const NAV_ITEMS = [
  // { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }, // Future?
  { href: '/inbox', label: 'Inbox', icon: Inbox },
  { href: '/alerts', label: 'Alerts', icon: Bell },
  { href: '/crm', label: 'CRM', icon: Users },         // Was Leads
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/account/login', label: 'Account', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="ui-sidebar">
      <div className="ui-sidebar__header">
        <div className="ui-sidebar__logoWrap">
          <Image
            src="/logo-nexxa.png"
            alt="Nexxa"
            fill
            priority
            sizes="240px"
            style={{ objectFit: 'contain' }}
          />
        </div>
      </div>

      <nav className="ui-sidebar__nav">
        {NAV_ITEMS.map((it) => {
          const active = isActive(pathname, it.href);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`ui-sidebar__link flex items-center gap-3 ${active ? 'is-active' : ''}`}
            >
              <Icon size={18} strokeWidth={2} className={active ? 'text-foreground' : 'text-muted-foreground'} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ui-sidebar__footer">
        <div className="ui-sidebar__footerTitle">Nexxa Agent System</div>
        <div className="ui-sidebar__footerVersion">V1</div>
      </div>
    </aside>
  );
}
