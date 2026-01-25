'use client';

import Image from 'next/image';
import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
  // { href: '/dashboard', key: 'dashboard', icon: LayoutDashboard }, 
  { href: '/inbox', key: 'inbox', icon: Inbox },
  { href: '/alerts', key: 'alerts', icon: Bell },
  { href: '/crm', key: 'crm', icon: Users },
  { href: '/calendar', key: 'calendar', icon: Calendar },
  { href: '/analytics', key: 'analytics', icon: BarChart3 },
  { href: '/account/login', key: 'account', icon: User },
  { href: '/settings', key: 'settings', icon: Settings },
];

function isActive(pathname: string, href: string) {
  // next-intl usePathname returns path without locale, so strict check or startsWith works
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
              <Icon size={18} strokeWidth={2} className={active ? 'text-foreground' : 'text-muted-foreground'} />
              <span>{t(it.key)}</span>
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
