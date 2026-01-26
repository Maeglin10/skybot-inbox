"use client";

import React from 'react';
import { useTranslations } from '@/lib/translations';
import { useUserPreferences } from '@/hooks/use-user-preferences';
import { Monitor, Moon, Sun, Palette } from 'lucide-react';
import { Theme, themes } from '@/lib/themes';
import { useTheme } from '@/components/theme-provider';

const THEME_NAMES: Theme[] = [
  "DEFAULT", "NORD", "GOLD", "NATURE", "NETFLIX", "LARACON", "DRACULA"
];

export default function AppearancePage() {
  const t = useTranslations('settings');
  const { preferences, updatePreferences } = useUserPreferences();
  const { mode, setMode } = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="ui-pageTitle">{t('theme')}</h2>
        <p className="ui-pageSubtitle">{t('customizeLook')}</p>
      </div>

      <div className="ui-card">
        <div className="ui-card__header">
           <div className="flex items-center gap-2">
              <Palette size={18} />
              <span className="font-semibold">{t('selectTheme')}</span>
           </div>
        </div>
        <div className="ui-card__body space-y-6">
           
           {/* Mode Toggle */}
           <div className="flex flex-col gap-2">
             <label className="text-sm font-medium text-foreground">{t('mode')}</label>
             <div className="flex items-center gap-2 bg-muted p-1 rounded-lg w-fit">
                <button 
                  onClick={() => setMode('light')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${mode === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   <Sun size={16} /> {t('light')}
                </button>
                <button 
                  onClick={() => setMode('system')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${mode === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   <Monitor size={16} /> {t('auto')}
                </button>
                <button 
                  onClick={() => setMode('dark')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-2 transition-all ${mode === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                   <Moon size={16} /> {t('dark')}
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
      </div>
    </div>
  );
}
