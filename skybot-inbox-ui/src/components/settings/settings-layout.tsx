'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { User, Shield, Palette, Languages, FileText, CreditCard, Plug, ChevronRight } from 'lucide-react';

const SETTINGS_NAV = [
  // Keeping keys simple for now, using existing labels as fallback or map to translation keys
  // For this exercise, I will use hardcoded mapping in render or assume specific keys
  { href: '/settings/profile', label: 'Profile', icon: User },
  { href: '/settings/security', label: 'Security', icon: Shield },
  { href: '/settings/appearance', label: 'Appearance', icon: Palette },
  { href: '/settings/language', label: 'Language', icon: Languages },
  { href: '/settings/billing', label: 'Billing', icon: CreditCard },
  { href: '/settings/integrations', label: 'Integrations', icon: Plug },
  { href: '/settings/legal', label: 'Legal', icon: FileText },
];

export function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const t = useTranslations('settings');
  const tNav = useTranslations('navigation');

  return (
    <div className="ui-page flex flex-row h-full overflow-hidden bg-background">
      {/* Settings Sidebar */}
      <aside className="w-72 border-r border-border/20 bg-muted/10 flex flex-col h-full">
        <div className="p-6 border-b border-border/20">
          <h1 className="text-xl font-bold">{t('preferences')}</h1>
          <p className="text-xs text-muted-foreground mt-1">Manage workspace preferences</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {SETTINGS_NAV.map((it) => {
             const Icon = it.icon;
             const active = pathname === it.href;
             // Try to find translation, fallback to label
             const translatedLabel = it.label; 
             
             return (
               <Link
                 key={it.href}
                 href={it.href}
                 className={`flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-all group ${
                    active 
                      ? 'bg-background text-foreground shadow-sm border border-border/40' 
                      : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                 }`}
               >
                 <div className="flex items-center gap-3">
                    <Icon size={16} className={active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground transition-colors'} />
                    {translatedLabel}
                 </div>
                 {active && <ChevronRight size={14} className="text-muted-foreground" />}
               </Link>
             );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-background/50">
        <div className="max-w-4xl mx-auto p-8 lg:p-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
           {children}
        </div>
      </main>
    </div>
  );
}
