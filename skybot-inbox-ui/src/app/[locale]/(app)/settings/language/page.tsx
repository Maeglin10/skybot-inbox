"use client";

import React, { useTransition } from 'react';
import { useTranslations } from '@/lib/translations';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Languages, Check } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' }
];

export default function LanguagePage() {
  const t = useTranslations('settings');
  const locale = 'es'; // Hardcoded Spanish UI
  const { preferences, updatePreferences } = useUserPreferences();

  // We only enable preference saving now, as UI is forced to ES.
  const handleLanguageChange = (newLocale: string) => {
    updatePreferences({ language: newLocale });
    // In a real full i18n app we would route/reload here.
    // For this demo with hardcoded ES, we just save the user preference.
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
                <span className="font-semibold">{t('systemLanguage')}</span>
             </div>
          </div>
          <div className="ui-card__body">
             <p className="text-sm text-muted-foreground mb-4">
               {/* Inform the user the UI is locked to ES for this demo if desired, or just show the selector */}
               La interfaz está configurada actualmente en Español. Puedes cambiar tu preferencia regional abajo.
             </p>
             <div className="grid gap-2 max-w-sm">
                {LOCALES.map(l => {
                   // Calculate active based on user preference to give feedback
                   const isActive = (preferences.language?.toLowerCase() || 'es') === l.code;
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
