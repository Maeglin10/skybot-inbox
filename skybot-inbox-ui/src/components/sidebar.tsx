'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/inbox', label: 'Inbox' },
  { href: '/alertes', label: 'Alertes' },
  { href: '/leads', label: 'Leads' },
  { href: '/settings', label: 'Settings' },
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
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`ui-sidebar__link ${active ? 'is-active' : ''}`}
            >
              {it.label}
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
