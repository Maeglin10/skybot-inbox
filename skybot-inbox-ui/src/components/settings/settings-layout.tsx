'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from '@/lib/translations';
import { User, Shield, Palette, Languages, FileText, CreditCard, Plug, ChevronRight, ChevronDown } from 'lucide-react';

const LOCALE = 'es'; // Hardcoded locale

interface SubmenuItem {
  href: string;
  key: string;
  label: string;
}

interface NavItem {
  href: string;
  key: string;
  icon: any;
  submenu?: SubmenuItem[];
}

const SETTINGS_NAV: NavItem[] = [
  { href: '/settings/profile', key: 'profile', icon: User },
  { href: '/settings/security', key: 'security', icon: Shield },
  { href: '/settings/appearance', key: 'appearance', icon: Palette },
  { href: '/settings/language', key: 'language', icon: Languages },
  { href: '/settings/billing', key: 'billing', icon: CreditCard },
  { href: '/settings/integrations', key: 'integrations', icon: Plug },
  {
    href: '/settings/legal',
    key: 'legal',
    icon: FileText,
    submenu: [
      { href: '/settings/legal/terms', key: 'terms', label: 'Términos y Condiciones' },
      { href: '/settings/legal/privacy', key: 'privacy', label: 'Política de Privacidad' },
    ],
  },
];

function buildHref(path: string): string {
  return `/${LOCALE}${path}`;
}

function isActive(pathname: string, href: string): boolean {
  const fullHref = buildHref(href);
  return pathname === fullHref || pathname.startsWith(fullHref + '/');
}

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('settings');
  const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

  // Auto-expand Legal if on a legal page
  React.useEffect(() => {
    if (pathname.includes('/settings/legal')) {
      setExpandedItem('legal');
    }
  }, [pathname]);

  return (
    <div className="flex-1 w-full flex flex-row h-full overflow-hidden bg-background">
      {/* Settings Sidebar */}
      <aside className="w-72 border-r border-border/20 bg-muted/10 flex flex-col h-full">
        <div className="p-6 border-b border-border/20">
          <h1 className="text-xl font-bold">{t('preferences')}</h1>
          <p className="text-xs text-muted-foreground mt-1">{t('manageWorkspace')}</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {SETTINGS_NAV.map((it) => {
             const Icon = it.icon;
             const active = isActive(pathname, it.href);
             const hasSubmenu = it.submenu && it.submenu.length > 0;
             const isExpanded = expandedItem === it.key;

             return (
               <div key={it.href}>
                 <button
                   onClick={() => {
                     if (hasSubmenu) {
                       setExpandedItem(isExpanded ? null : it.key);
                     } else {
                       router.push(buildHref(it.href));
                     }
                   }}
                   className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                      active && !hasSubmenu
                        ? 'bg-background text-foreground shadow-sm border border-border/40'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                      <Icon size={16} className={active && !hasSubmenu ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'} />
                      {/* @ts-ignore - Dynamic key access */}
                      {t(it.key)}
                   </div>
                   {hasSubmenu ? (
                     isExpanded ? <ChevronDown size={14} className="text-muted-foreground" /> : <ChevronRight size={14} className="text-muted-foreground" />
                   ) : (
                     active && <ChevronRight size={14} className="text-muted-foreground" />
                   )}
                 </button>

                 {/* Submenu */}
                 {hasSubmenu && isExpanded && (
                   <div className="ml-6 mt-1 space-y-1">
                     {it.submenu!.map((subItem) => {
                       const subActive = isActive(pathname, subItem.href);
                       return (
                         <button
                           key={subItem.href}
                           onClick={() => router.push(buildHref(subItem.href))}
                           className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-all ${
                             subActive
                               ? 'bg-background text-foreground shadow-sm border border-border/40'
                               : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                           }`}
                         >
                           <span className="text-xs">{subItem.label}</span>
                           {subActive && <ChevronRight size={12} className="text-muted-foreground" />}
                         </button>
                       );
                     })}
                   </div>
                 )}
               </div>
             );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background/50">
        <div className="max-w-4xl mx-auto p-8 lg:p-12">
           {children}
        </div>
      </main>
    </div>
  );
}
