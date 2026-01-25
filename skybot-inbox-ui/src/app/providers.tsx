"use client";

import React, { useEffect } from "react";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import { useUserPreferences } from "@/hooks/use-user-preferences";

function PreferencesSync() {
  const { preferences } = useUserPreferences();
  const { setTheme } = useTheme();

  // We only enable this sync initial load mostly, or if preferences specifically change from outside
  // But useUserPreferences already does setThemes on internal changes.
  // This component's main job is just to mount the fetching hook at the top level
  // so that even if we are not on the settings page, we load the user's theme.
  
  // This hook has internal useEffect that fetches and calls setTheme.
  // We don't render anything.
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
       <PreferencesSync />
       {children}
    </ThemeProvider>
  );
}
