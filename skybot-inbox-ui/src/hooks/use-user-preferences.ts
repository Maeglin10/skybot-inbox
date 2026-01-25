"use client";

import { useEffect, useState, useCallback } from "react";
import { apiGetClient, apiPatchClient } from "@/lib/api.client";
import { useTheme } from "@/components/theme-provider";
import { useRouter, usePathname } from "@/i18n/navigation";
import { Theme } from "@/lib/themes";

export interface UserPreferences {
  theme: Theme;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "DEFAULT",
  language: "en",
  timezone: "UTC",
  dateFormat: "MM/DD/YYYY",
  timeFormat: "12h"
};

export function useUserPreferences(userAccountId = "me") {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // Fetch on mount
  useEffect(() => {
    let mounted = true;
    setLoading(true);
    
    apiGetClient(`/preferences/${userAccountId}`)
      .then((data: any) => {
        if (!mounted) return;
        setPreferences(prev => ({ ...prev, ...data }));
        
        // Sync global theme state if fetched
        if (data.theme) {
            setTheme(data.theme);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch preferences:", err);
        setError("Failed to load preferences");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [userAccountId, setTheme]);

  // Update function
  const updatePreferences = useCallback(async (updates: Partial<UserPreferences>) => {
    setSaving(true);
    // Optimistic update
    setPreferences(prev => ({ ...prev, ...updates }));

    // Side effects logic
    if (updates.theme) {
      setTheme(updates.theme);
    }
    if (updates.language) {
       // Language switch logic needs to happen via router
       const newLocale = updates.language.toLowerCase();
       // Only redirect if different to avoid redundant navigation
       // Note: we can't easily access current locale here without hooking into params/next-intl
       // but we will trust the caller or just execute
       router.replace(pathname, { locale: newLocale });
    }

    try {
      await apiPatchClient(`/preferences/${userAccountId}`, updates);
    } catch (err) {
      console.error("Failed to save preferences:", err);
      // Revert? Or just show error
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }, [userAccountId, setTheme, router, pathname]);

  return {
    preferences,
    loading,
    saving,
    error,
    updatePreferences
  };
}
