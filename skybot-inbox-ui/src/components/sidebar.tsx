'use client';

import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/translations';
import {
  Inbox,
  Bell,
  Users,
  BarChart3,
  Settings,
  Calendar
} from 'lucide-react';

const LOCALE = 'es'; // Hardcoded locale

const NAV_ITEMS = [
  { href: '/inbox', key: 'inbox', icon: Inbox },
  { href: '/alerts', key: 'alerts', icon: Bell },
  { href: '/crm', key: 'crm', icon: Users },
  { href: '/calendar', key: 'calendar', icon: Calendar },
  { href: '/analytics', key: 'analytics', icon: BarChart3 },
  // Temporarily hidden - keeping code for future development
  // { href: '/agents', key: 'agents', icon: Bot },
  // { href: '/marketplace', key: 'marketplace', icon: Store },
  { href: '/settings', key: 'settings', icon: Settings },
];

function buildHref(path: string): string {
  return `/${LOCALE}${path}`;
}

function isActive(pathname: string, href: string): boolean {
  const fullHref = buildHref(href);
  return pathname === fullHref || pathname.startsWith(fullHref + '/');
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('navigation');

  const handleNavClick = (href: string) => {
    const fullHref = buildHref(href);
    router.push(fullHref);
  };

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
            <button
              key={it.href}
              onClick={() => handleNavClick(it.href)}
              className={`ui-sidebar__link flex items-center gap-3 w-full text-left ${active ? 'is-active' : ''}`}
            >
              <Icon
                size={18}
                strokeWidth={2}
                className={`flex-shrink-0 ${active ? 'text-foreground' : 'text-muted-foreground'}`}
              />
              <span className="font-medium leading-none">{t(it.key)}</span>
            </button>
          );
        })}
      </nav>

      <div className="ui-sidebar__footer !block">
        <div className="mb-2 flex items-center justify-between">
          <div className="ui-sidebar__footerTitle">Nexxa Agent System</div>
          <div className="ui-sidebar__footerVersion">V1</div>
        </div>
      </div>
    </aside>
  );
}
