"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from './theme-provider';
import { Theme, themes } from '@/lib/themes';
import { apiPatchClient } from '@/lib/api.client';
import { Check, ChevronDown, Monitor, Moon, Sun, Palette } from 'lucide-react';

const THEME_NAMES: Theme[] = [
  "DEFAULT", 
  "NORD", 
  "GOLD", 
  "NATURE", 
  "NETFLIX", 
  "LARACON", 
  "DRACULA"
];

export function ThemeSwitcher({ userAccountId = "me" }: { userAccountId?: string }) {
  const { theme, mode, setTheme, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);

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

  const handleThemeChange = async (newTheme: Theme) => {
    setTheme(newTheme);
    // API Call
    try {
      setLoading(true);
      await apiPatchClient(`/preferences/${userAccountId}`, { theme: newTheme });
    } catch (error) {
      console.error("Failed to sync theme preference", error);
      // Optional: Toast here
    } finally {
      setLoading(false);
    }
  };

  const handleModeChange = async (newMode: 'light' | 'dark' | 'system') => {
    setMode(newMode);
    // API Call if supported, assumed maybe part of preferences?
    // The prompt only mentioned PATCH { theme }, but usually mode is also desired.
    // I'll stick to theme for the API strictly as requested for "theme", but maybe send mode too if useful.
    // Spec: "PATCH /api/preferences/:userAccountId { theme }" - theme might imply both or just the color theme.
    // I will just send theme here.
  };

  // Helper to render preview swatch
  const renderSwatch = (t: Theme) => {
    const vars = themes[t].light; // Use light mode vars for consistent preview or use current mode?
    // Let's use the primary color and background
    const bg = `hsl(${vars['--background']})`;
    const prim = `hsl(${vars['--primary']})`;
    const acc = `hsl(${vars['--accent']})`;
    return (
      <div className="flex gap-1 items-center">
        <div className="w-4 h-4 rounded-full border shadow-sm" style={{ background: bg }}></div>
        <div className="w-4 h-4 rounded-full border shadow-sm" style={{ background: prim }}></div>
        <div className="w-4 h-4 rounded-full border shadow-sm" style={{ background: acc }}></div>
      </div>
    );
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="ui-btn flex items-center gap-2 px-3 py-2 text-sm font-medium"
      >
        <Palette size={16} className="text-muted-foreground" />
        <span>Theme</span>
        <ChevronDown size={14} className={`text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--popover))] shadow-lg p-2 z-50 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Mode Switcher */}
          <div className="flex p-1 bg-[hsl(var(--muted))] rounded-lg mb-3">
            <button
              onClick={() => handleModeChange('light')}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'light' ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
            >
              <Sun size={14} className="mr-1.5" /> Light
            </button>
            <button
              onClick={() => handleModeChange('system')}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'system' ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
            >
              <Monitor size={14} className="mr-1.5" /> Auto
            </button>
            <button
              onClick={() => handleModeChange('dark')}
              className={`flex-1 flex items-center justify-center py-1.5 rounded-md text-xs font-medium transition-all ${mode === 'dark' ? 'bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm' : 'text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]'}`}
            >
              <Moon size={14} className="mr-1.5" /> Dark
            </button>
          </div>

          <div className="space-y-1 max-h-64 overflow-y-auto">
            <div className="px-2 py-1.5 text-xs font-semibold text-[hsl(var(--muted-foreground))]">
              Color Scheme
            </div>
            {THEME_NAMES.map((t) => (
              <button
                key={t}
                onClick={() => handleThemeChange(t)}
                disabled={loading && theme === t}
                className={`w-full flex items-center justify-between px-2 py-2 rounded-md text-sm transition-colors ${
                  theme === t 
                    ? 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]' 
                    : 'hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]'
                }`}
              >
                <div className="flex items-center gap-3">
                   <div className="text-left">
                      <span className="block text-xs font-medium">{t}</span>
                   </div>
                </div>
                {theme === t && <Check size={14} className="text-primary" />}
                {/* Optional Swatch, tricky to show since we need real values - reusing renderSwatch */}
                <div className="ml-auto mr-2">
                   {renderSwatch(t)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
