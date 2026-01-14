import Link from 'next/link';

const items = [
  { href: '/inbox', label: 'Inbox' },
  { href: '/alerts', label: 'Alertes' }, // stub
  { href: '/settings', label: 'Settings' }, // stub
];

export function Sidebar() {
  return (
    <aside className="border-r h-dvh p-3">
      <div className="px-2 py-2 text-sm font-semibold">Skybot Inbox</div>
      <nav className="mt-2 space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block rounded-md px-2 py-2 text-sm hover:bg-muted"
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}