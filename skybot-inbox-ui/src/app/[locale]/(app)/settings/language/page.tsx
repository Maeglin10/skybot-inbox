"use client";

import React, { useTransition } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Languages, Check } from 'lucide-react';
import { apiPatchClient } from '@/lib/api.client';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' }
];

export default function LanguagePage() {
  const t = useTranslations('settings');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { preferences, updatePreferences } = useUserPreferences();
  const [isPending, startTransition] = useTransition();

  const handleLanguageChange = (newLocale: string) => {
    // 1. Optimistic UI update via hook (persists to backend)
    updatePreferences({ language: newLocale });

    // 2. Switch locale routing immediately
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  return (
    <div className="space-y-6">
       <div>
          <h2 className="ui-pageTitle">{t('language')}</h2>
          <p className="ui-pageSubtitle">{t('selectLanguage')}</p>
       </div>
       
       <div className="ui-card">
          <div className="ui-card__header">
             <div className="flex items-center gap-2">
                <Languages size={18} />
                <span className="font-semibold">{t('language')}</span>
             </div>
          </div>
          <div className="ui-card__body">
             <div className="grid gap-2 max-w-sm">
                {LOCALES.map(l => {
                   const isActive = locale === l.code;
                   return (
                     <button
                       key={l.code}
                       onClick={() => handleLanguageChange(l.code)}
                       className={`flex items-center justify-between px-4 py-3 rounded-lg border transition-all text-sm font-medium ${
                         isActive 
                           ? 'border-primary bg-primary/5 text-primary' 
                           : 'border-border hover:bg-muted/50 hover:border-border/80'
                       }`}
                     >
                       <div className="flex items-center gap-3">
                          <span className="text-lg leading-none">{l.code === 'en' ? '🇺🇸' : l.code === 'fr' ? '🇫🇷' : l.code === 'es' ? '🇪🇸' : '🇵🇹'}</span>
                          <span>{l.label}</span>
                       </div>
                       {isActive && <Check size={16} />}
                     </button>
                   );
                })}
             </div>
          </div>
       </div>
    </div>
  );
}
