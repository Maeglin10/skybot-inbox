import Link from "next/link";

const items = [
  { href: "/inbox", label: "Inbox" },
  { href: "/alerts", label: "Alertes" },
  { href: "/crm", label: "Leads" },
  { href: "/settings", label: "Settings" },
];

export function Sidebar() {
  return (
    <aside className="h-screen w-60 border-r bg-background">
      <div className="p-4 font-semibold">Skybot</div>
      <nav className="px-2 space-y-1">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className="block rounded-md px-3 py-2 text-sm hover:bg-muted"
          >
            {it.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
