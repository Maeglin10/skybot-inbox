'use client';

import Image from 'next/image';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from '@/lib/translations';
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
// ThemeSwitcher removed from Sidebar footer

const NAV_ITEMS = [
  // { href: '/es/dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/es/inbox', key: 'inbox', icon: Inbox },
  { href: '/es/alerts', key: 'alerts', icon: Bell },
  { href: '/es/crm', key: 'crm', icon: Users },
  { href: '/es/calendar', key: 'calendar', icon: Calendar },
  { href: '/es/analytics', key: 'analytics', icon: BarChart3 },
  { href: '/es/account/login', key: 'account', icon: User },
  { href: '/es/settings', key: 'settings', icon: Settings },
];

function isActive(pathname: string, href: string) {
  // Check if current pathname matches the href
  return pathname === href || pathname.startsWith(href + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('navigation');

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
               {/* 
                 Updated alignment: Icon and Text now properly aligned on the same visual line (flex items-center handles this but ensure no extra margins are breaking it).
                 Current class "flex items-center gap-3" handles row alignment.
                 The previous issue might have been logo scaling or different implementation.
               */}
              <Icon size={18} strokeWidth={2} className={`flex-shrink-0 ${active ? 'text-foreground' : 'text-muted-foreground'}`} />
              <span className="font-medium leading-none">{t(it.key)}</span>
            </Link>
          );
        })}
      </nav>

      <div className="ui-sidebar__footer !block">
        <div className="mb-2 flex items-center justify-between">
          <div className="ui-sidebar__footerTitle">Nexxa Agent System</div>
          <div className="ui-sidebar__footerVersion">V1</div>
        </div>
        {/* ThemeSwitcher moved to Settings -> Appearance */}
      </div>
    </aside>
  );
}
