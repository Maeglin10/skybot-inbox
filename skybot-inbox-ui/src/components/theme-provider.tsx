"use client";

import React, { createContext, useContext, useEffect, useLayoutEffect, useState } from 'react';
import { Theme, themes, applyTheme } from '@/lib/themes';

type Mode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  mode: Mode;
  setTheme: (theme: Theme) => void;
  setMode: (mode: Mode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Helper to get system preference
function getSystemMode(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark'; // Default server-side
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Initialize with defaults to avoid mismatch, but we will sync immediately
  const [theme, setTheme] = useState<Theme>('DEFAULT');
  const [mode, setMode] = useState<Mode>('system');
  const [mounted, setMounted] = useState(false);

  // Use useLayoutEffect to apply theme as early as possible on client
  // We use a safeLayoutEffect to avoid server warnings if needed, but 'use client' implies client.
  const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

  useEffect(() => {
    // Read storage on mount
    try {
      const savedTheme = localStorage.getItem('nx-theme');
      const savedMode = localStorage.getItem('nx-mode');
      
      // Validate and set
      if (savedTheme && savedTheme in themes) {
        setTheme(savedTheme as Theme);
      }
      if (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system') {
        setMode(savedMode as Mode);
      }
    } catch (e) {
      console.warn("Failed to load theme preferences", e);
    }
    setMounted(true);
  }, []);

  // Sync effect
  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;

    const apply = () => {
      const effectiveMode = mode === 'system' ? getSystemMode() : mode;
      
      // Update DOM
      applyTheme(theme, effectiveMode);
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.setAttribute('data-mode', effectiveMode);
      
      // Persist
      localStorage.setItem('nx-theme', theme);
      localStorage.setItem('nx-mode', mode);
    };

    apply();

    // If system, listen for changes
    if (mode === 'system') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => apply();
      media.addEventListener('change', listener);
      return () => media.removeEventListener('change', listener);
    }
  }, [theme, mode, mounted]);

  // Prevent hydration mismatch by initially rendering without applying? 
  // Or we just accept that the first paint might be default.
  // We'll return children always, but the effect will snap it quickly.
  
  return (
    <ThemeContext.Provider value={{ theme, mode, setTheme, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
