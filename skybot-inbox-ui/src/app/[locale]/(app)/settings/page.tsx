"use client";

import React from 'react';
import { useTranslations } from '@/lib/translations';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Monitor, Moon, Sun, Clock, Calendar as CalendarIcon, Languages as LangIcon, Palette } from 'lucide-react';
import { Theme, themes } from '@/lib/themes';
import { useTheme } from '@/components/theme-provider';

const THEME_NAMES: Theme[] = [
  "DEFAULT", "NORD", "GOLD", "NATURE", "NETFLIX", "LARACON", "DRACULA"
];

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' }
];

const TIMEZONES = [
  "UTC", "America/New_York", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Asia/Tokyo"
];

const DATE_FORMATS = [
  "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"
];

const TIME_FORMATS = [
  "12h", "24h"
];

export default function PreferencesPage() {
  const t = useTranslations('settings');
  const tCommon = useTranslations('common');
  const { preferences, loading, saving, updatePreferences } = useUserPreferences();
  const { mode, setMode } = useTheme(); // We can use global theme context for mode

  if (loading) {
     return <div className="p-8 text-muted-foreground">{tCommon('loading')}</div>;
  }

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div>
        <h2 className="ui-pageTitle">{t('preferences')}</h2>
        <p className="ui-pageSubtitle">Customize your interface and regional settings.</p>
      </div>

      {/* Appearance Section */}
      <section className="ui-card">
        <div className="ui-card__header">
           <div className="flex items-center gap-2">
              <Palette size={18} />
              <span className="font-semibold">{t('theme')}</span>
           </div>
        </div>
        <div className="ui-card__body space-y-6">
           
           {/* Mode Toggle */}
           <div className="flex flex-col gap-2">
             <label className="text-sm font-medium text-foreground">Mode</label>
             <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
                <button 
                  onClick={() => setMode('light')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${mode === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   <Sun size={16} /> Light
                </button>
                <button 
                  onClick={() => setMode('system')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${mode === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   <Monitor size={16} /> Auto
                </button>
                <button 
                  onClick={() => setMode('dark')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${mode === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   <Moon size={16} /> Dark
                </button>
             </div>
           </div>

           {/* Theme Select */}
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {THEME_NAMES.map(themeName => {
                 const isActive = preferences.theme === themeName;
                 // Get preview colors
                 const vars = themes[themeName].light; 
                 const bg = `hsl(${vars['--background']})`;
                 const primary = `hsl(${vars['--primary']})`;

                 return (
                   <button
                     key={themeName}
                     onClick={() => updatePreferences({ theme: themeName })}
                     className={`relative border rounded-xl overflow-hidden text-left hover:ring-2 hover:ring-primary/50 transition-all ${isActive ? 'ring-2 ring-primary border-primary' : 'border-border'}`}
                   >
                      <div className="h-12 w-full flex" style={{ background: bg }}>
                         <div className="h-full w-1/4" style={{ background: `hsl(${vars['--muted']})` }}></div>
                         <div className="mt-2 ml-2 h-4 w-4 rounded-full" style={{ background: primary }}></div>
                      </div>
                      <div className="p-2.5 bg-card">
                         <div className="text-xs font-semibold">{themeName}</div>
                      </div>
                      {isActive && <div className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />}
                   </button>
                 );
              })}
           </div>

        </div>
      </section>

      {/* Regional Section */}
      <section className="ui-card">
        <div className="ui-card__header">
           <div className="flex items-center gap-2">
              <LangIcon size={18} />
              <span className="font-semibold">Language & Region</span>
           </div>
        </div>
        <div className="ui-card__body grid gap-6 md:grid-cols-2">
           
           {/* Language */}
           <div className="space-y-2">
              <label className="text-sm font-medium">{t('language')}</label>
              <select 
                className="ui-input w-full"
                value={preferences.language}
                onChange={(e) => updatePreferences({ language: e.target.value })}
              >
                {LOCALES.map(l => (
                   <option key={l.code} value={l.code}>{l.label}</option>
                ))}
              </select>
           </div>

           {/* Timezone */}
           <div className="space-y-2">
              <label className="text-sm font-medium">{t('timezone')}</label>
              <select 
                className="ui-input w-full"
                value={preferences.timezone}
                onChange={(e) => updatePreferences({ timezone: e.target.value })}
              >
                {TIMEZONES.map(tz => (
                   <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
           </div>

           {/* Date Format */}
           <div className="space-y-2">
              <label className="text-sm font-medium">{t('dateFormat')}</label>
              <div className="relative">
                 <CalendarIcon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <select 
                    className="ui-input w-full pl-9"
                    value={preferences.dateFormat}
                    onChange={(e) => updatePreferences({ dateFormat: e.target.value })}
                 >
                   {DATE_FORMATS.map(f => (
                      <option key={f} value={f}>{f}</option>
                   ))}
                 </select>
              </div>
           </div>

           {/* Time Format */}
           <div className="space-y-2">
              <label className="text-sm font-medium">{t('timeFormat')}</label>
              <div className="relative">
                 <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                 <select 
                    className="ui-input w-full pl-9"
                    value={preferences.timeFormat}
                    onChange={(e) => updatePreferences({ timeFormat: e.target.value })}
                 >
                   {TIME_FORMATS.map(f => (
                      <option key={f} value={f}>{f}</option>
                   ))}
                 </select>
              </div>
           </div>

        </div>
      </section>

      {/* Status */}
      <div className="flex justify-end text-xs text-muted-foreground">
         {saving ? <span>Saving...</span> : <span>Preferences saved</span>}
      </div>

    </div>
  );
}
