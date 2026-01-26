"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from '@/lib/translations';
import { apiPatchClient } from '@/lib/api.client';
import { Check, ChevronDown, Languages, Globe } from 'lucide-react';

const LOCALES = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'pt', label: 'Português' }
];

export function LanguageSwitcher({ userAccountId = "me" }: { userAccountId?: string }) {
  const t = useTranslations('settings');
  const locale = 'es'; // Hardcoded to Spanish
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);

    // Persist to API
    apiPatchClient(`/preferences/${userAccountId}`, {
      language: newLocale.toUpperCase()
    }).catch(console.error);
  };

  const currentLabel = LOCALES.find(l => l.code === locale)?.code?.toUpperCase() || locale.toUpperCase();

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ui-btn flex items-center gap-2 px-3 py-2 text-sm font-medium"
      >
        <Globe size={16} className="text-muted-foreground" />
        <span>{currentLabel}</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-2 py-1.5 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
            {t('selectLanguage')}
          </div>
          {LOCALES.map((l) => (
            <button
              key={l.code}
              onClick={() => handleLanguageChange(l.code)}
              className={`w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors ${
                locale === l.code
                  ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]'
                  : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
              }`}
            >
              <span className="block text-sm font-medium">{l.label}</span>
              {locale === l.code && <Check size={14} className="text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
