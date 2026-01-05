'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/inbox", label: "Inbox" },
  { href: "/alerts", label: "Alertes" },
  { href: "/crm", label: "Leads" },
  { href: "/settings", label: "Settings" },
];

function isActive(pathname: string, href: string) {
  if (href === "/inbox") return pathname === "/inbox" || pathname.startsWith("/inbox/");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname() || "";

  return (
    <aside className="h-screen w-60 border-r bg-background">
      <div className="p-4 font-semibold">Nexxa Agent System</div>

      <nav className="px-2 space-y-1">
        {items.map((it) => {
          const active = isActive(pathname, it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={[
                "block rounded-md px-3 py-2 text-sm",
                active ? "bg-muted font-medium" : "hover:bg-muted",
              ].join(" ")}
            >
              {it.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}