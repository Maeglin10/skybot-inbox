import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export type Theme = 
  | "DEFAULT" 
  | "NORD" 
  | "GOLD" 
  | "NATURE" 
  | "NETFLIX" 
  | "LARACON" 
  | "DRACULA" 
  | "LIGHT" 
  | "DARK" 
  | "SYSTEM";

export const themes: Record<Theme, { light: Record<string, string>; dark: Record<string, string> }> = {
  DEFAULT: {
    light: {
      "--background": "0 0% 98%",
      "--foreground": "0 0% 5%",
      "--card": "0 0% 100%",
      "--card-foreground": "0 0% 5%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "0 0% 5%",
      "--primary": "310 48% 42%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "210 20% 96%",
      "--secondary-foreground": "240 5.9% 10%",
      "--muted": "210 20% 96%",
      "--muted-foreground": "210 7% 55%",
      "--accent": "210 20% 93%",
      "--accent-foreground": "240 5.9% 10%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "210 16% 88%",
      "--input": "210 16% 88%",
      "--ring": "310 48% 42%",
      "--radius": "0.5rem"
    },
    dark: {
      "--background": "0 0% 0%",
      "--foreground": "0 0% 100%",
      "--card": "0 0% 3.9%",
      "--card-foreground": "0 0% 98%",
      "--popover": "0 0% 3.9%",
      "--popover-foreground": "0 0% 98%",
      "--primary": "310 47% 42%",
      "--primary-foreground": "0 0% 100%",
      "--secondary": "310 46% 22%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "310 46% 22%",
      "--muted-foreground": "210 7% 60%",
      "--accent": "310 46% 22%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 62.8% 30.6%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "310 46% 22%",
      "--input": "310 46% 22%",
      "--ring": "310 47% 42%",
      "--radius": "0.5rem"
    }
  },
  NORD: {
    light: {
      "--background": "220 17% 98%", 
      "--foreground": "220 16% 22%",
      "--card": "220 17% 98%",
      "--card-foreground": "220 16% 22%",
      "--popover": "220 17% 98%",
      "--popover-foreground": "220 16% 22%",
      "--primary": "193 43% 67%",
      "--primary-foreground": "222 47% 11%",
      "--secondary": "220 17% 92%",
      "--secondary-foreground": "222 47% 11%",
      "--muted": "220 17% 92%",
      "--muted-foreground": "220 8% 46%",
      "--accent": "220 17% 92%",
      "--accent-foreground": "222 47% 11%",
      "--destructive": "354 42% 56%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "220 16% 85%",
      "--input": "220 16% 85%",
      "--ring": "193 43% 67%",
      "--radius": "0.5rem"
    },
    dark: {
      "--background": "222 47% 11%",
      "--foreground": "213 27% 84%",
      "--card": "222 47% 11%",
      "--card-foreground": "213 27% 84%",
      "--popover": "222 47% 11%",
      "--popover-foreground": "213 27% 84%",
      "--primary": "193 43% 67%",
      "--primary-foreground": "222 47% 11%",
      "--secondary": "220 17% 22%",
      "--secondary-foreground": "213 27% 84%",
      "--muted": "220 17% 22%",
      "--muted-foreground": "213 15% 60%",
      "--accent": "220 17% 22%",
      "--accent-foreground": "213 27% 84%",
      "--destructive": "354 42% 56%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "220 17% 22%",
      "--input": "220 17% 22%",
      "--ring": "193 43% 67%",
      "--radius": "0.5rem"
    }
  },
  GOLD: {
    light: {
      "--background": "48 100% 96%",
      "--foreground": "20 14.3% 4.1%",
      "--card": "48 100% 96%",
      "--card-foreground": "20 14.3% 4.1%",
      "--popover": "48 100% 96%",
      "--popover-foreground": "20 14.3% 4.1%",
      "--primary": "45 93% 47%",
      "--primary-foreground": "26 83.3% 14.1%",
      "--secondary": "60 4.8% 95.9%",
      "--secondary-foreground": "24 9.8% 10%",
      "--muted": "60 4.8% 95.9%",
      "--muted-foreground": "25 5.3% 44.7%",
      "--accent": "60 4.8% 95.9%",
      "--accent-foreground": "24 9.8% 10%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "60 9.1% 97.8%",
      "--border": "20 5.9% 90%",
      "--input": "20 5.9% 90%",
      "--ring": "45 93% 47%",
      "--radius": "0.5rem"
    },
    dark: {
      "--background": "20 14.3% 4.1%",
      "--foreground": "60 9.1% 97.8%",
      "--card": "20 14.3% 4.1%",
      "--card-foreground": "60 9.1% 97.8%",
      "--popover": "20 14.3% 4.1%",
      "--popover-foreground": "60 9.1% 97.8%",
      "--primary": "47.9 95.8% 53.1%",
      "--primary-foreground": "26 83.3% 14.1%",
      "--secondary": "12 6.5% 15.1%",
      "--secondary-foreground": "60 9.1% 97.8%",
      "--muted": "12 6.5% 15.1%",
      "--muted-foreground": "24 5.4% 63.9%",
      "--accent": "12 6.5% 15.1%",
      "--accent-foreground": "60 9.1% 97.8%",
      "--destructive": "0 62.8% 30.6%",
      "--destructive-foreground": "60 9.1% 97.8%",
      "--border": "12 6.5% 15.1%",
      "--input": "12 6.5% 15.1%",
      "--ring": "47.9 95.8% 53.1%",
      "--radius": "0.5rem"
    }
  },
  NATURE: {
    light: {
      "--background": "142 76% 97%",
      "--foreground": "142 69% 4%",
      "--card": "142 76% 97%",
      "--card-foreground": "142 69% 4%",
      "--popover": "142 76% 97%",
      "--popover-foreground": "142 69% 4%",
      "--primary": "142 76% 36%",
      "--primary-foreground": "355.7 100% 97.3%",
      "--secondary": "142 30% 90%",
      "--secondary-foreground": "142 69% 4%",
      "--muted": "142 30% 90%",
      "--muted-foreground": "142 10% 40%",
      "--accent": "142 30% 90%",
      "--accent-foreground": "142 69% 4%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "142 30% 85%",
      "--input": "142 30% 85%",
      "--ring": "142 76% 36%",
      "--radius": "0.5rem"
    },
    dark: {
      "--background": "142 69% 4%",
      "--foreground": "142 76% 97%",
      "--card": "142 69% 4%",
      "--card-foreground": "142 76% 97%",
      "--popover": "142 69% 4%",
      "--popover-foreground": "142 76% 97%",
      "--primary": "142 70% 50%",
      "--primary-foreground": "144.9 80.4% 10%",
      "--secondary": "142 30% 15%",
      "--secondary-foreground": "142 76% 97%",
      "--muted": "142 30% 15%",
      "--muted-foreground": "142 20% 65%",
      "--accent": "142 30% 15%",
      "--accent-foreground": "142 76% 97%",
      "--destructive": "0 62.8% 30.6%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "142 30% 15%",
      "--input": "142 30% 15%",
      "--ring": "142 70% 50%",
      "--radius": "0.5rem"
    }
  },
  NETFLIX: {
    light: {
      "--background": "0 0% 100%",
      "--foreground": "0 0% 3.9%",
      "--card": "0 0% 100%",
      "--card-foreground": "0 0% 3.9%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "0 0% 3.9%",
      "--primary": "0 72% 51%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "0 0% 96.1%",
      "--secondary-foreground": "0 0% 9%",
      "--muted": "0 0% 96.1%",
      "--muted-foreground": "0 0% 45.1%",
      "--accent": "0 0% 96.1%",
      "--accent-foreground": "0 0% 9%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "0 0% 89.8%",
      "--input": "0 0% 89.8%",
      "--ring": "0 72% 51%",
      "--radius": "0.5rem"
    },
    dark: {
      "--background": "0 0% 8%",
      "--foreground": "0 0% 98%",
      "--card": "0 0% 8%",
      "--card-foreground": "0 0% 98%",
      "--popover": "0 0% 8%",
      "--popover-foreground": "0 0% 98%",
      "--primary": "0 72% 51%",
      "--primary-foreground": "0 0% 98%",
      "--secondary": "0 0% 14.9%",
      "--secondary-foreground": "0 0% 98%",
      "--muted": "0 0% 14.9%",
      "--muted-foreground": "0 0% 63.9%",
      "--accent": "0 0% 14.9%",
      "--accent-foreground": "0 0% 98%",
      "--destructive": "0 62.8% 30.6%",
      "--destructive-foreground": "0 0% 98%",
      "--border": "0 0% 14.9%",
      "--input": "0 0% 14.9%",
      "--ring": "0 72% 51%",
      "--radius": "0.5rem"
    }
  },
  LARACON: {
    light: {
      "--background": "220 14% 96%",
      "--foreground": "222 47% 11%",
      "--card": "0 0% 100%",
      "--card-foreground": "222 47% 11%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "222 47% 11%",
      "--primary": "217 91% 60%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "210 40% 96.1%",
      "--secondary-foreground": "222 47% 11%",
      "--muted": "210 40% 96.1%",
      "--muted-foreground": "215.4 16.3% 46.9%",
      "--accent": "210 40% 96.1%",
      "--accent-foreground": "222 47% 11%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "214.3 31.8% 91.4%",
      "--input": "214.3 31.8% 91.4%",
      "--ring": "217 91% 60%",
      "--radius": "0.75rem"
    },
    dark: {
      "--background": "222 47% 11%",
      "--foreground": "210 40% 98%",
      "--card": "222 47% 11%",
      "--card-foreground": "210 40% 98%",
      "--popover": "222 47% 11%",
      "--popover-foreground": "210 40% 98%",
      "--primary": "217 91% 60%",
      "--primary-foreground": "222 47% 11%",
      "--secondary": "217.2 32.6% 17.5%",
      "--secondary-foreground": "210 40% 98%",
      "--muted": "217.2 32.6% 17.5%",
      "--muted-foreground": "215 20.2% 65.1%",
      "--accent": "217.2 32.6% 17.5%",
      "--accent-foreground": "210 40% 98%",
      "--destructive": "0 62.8% 30.6%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "217.2 32.6% 17.5%",
      "--input": "217.2 32.6% 17.5%",
      "--ring": "217 91% 60%",
      "--radius": "0.75rem"
    }
  },
  DRACULA: {
    light: {
      "--background": "265 89% 96%",
      "--foreground": "231 15% 18%",
      "--card": "0 0% 100%",
      "--card-foreground": "231 15% 18%",
      "--popover": "0 0% 100%",
      "--popover-foreground": "231 15% 18%",
      "--primary": "265 89% 66%",
      "--primary-foreground": "210 40% 98%",
      "--secondary": "265 59% 90%",
      "--secondary-foreground": "265 89% 66%",
      "--muted": "265 59% 90%",
      "--muted-foreground": "265 19% 45%",
      "--accent": "265 59% 90%",
      "--accent-foreground": "265 89% 66%",
      "--destructive": "0 84.2% 60.2%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "265 59% 90%",
      "--input": "265 59% 90%",
      "--ring": "265 89% 66%",
      "--radius": "0.5rem"
    },
    dark: {
      "--background": "231 15% 18%",
      "--foreground": "60 30% 96%",
      "--card": "231 15% 18%",
      "--card-foreground": "60 30% 96%",
      "--popover": "231 15% 18%",
      "--popover-foreground": "60 30% 96%",
      "--primary": "326 100% 74%",
      "--primary-foreground": "231 15% 18%",
      "--secondary": "231 15% 12%",
      "--secondary-foreground": "60 30% 96%",
      "--muted": "231 15% 12%",
      "--muted-foreground": "231 15% 60%",
      "--accent": "231 15% 12%",
      "--accent-foreground": "60 30% 96%",
      "--destructive": "0 62.8% 30.6%",
      "--destructive-foreground": "210 40% 98%",
      "--border": "231 15% 25%",
      "--input": "231 15% 25%",
      "--ring": "326 100% 74%",
      "--radius": "0.5rem"
    }
  },
  // Mapping these to DEFAULT to satisfy the Record<Theme, ...> type
  LIGHT: {} as any, 
  DARK: {} as any,
  SYSTEM: {} as any,
};

// Aliasing the mode keys to Default
themes.LIGHT = themes.DEFAULT;
themes.DARK = themes.DEFAULT;
themes.SYSTEM = themes.DEFAULT;

export function applyTheme(theme: Theme, mode: "light" | "dark") {
  const root = document.documentElement;
  
  // Handle aliases just in case, though they are mapped in the object
  const effectiveTheme = (theme === "LIGHT" || theme === "DARK" || theme === "SYSTEM") 
   ? "DEFAULT" 
   : theme;

  const themeConfig = themes[effectiveTheme];
  if (!themeConfig) return;

  const colors = themeConfig[mode];
  
  Object.entries(colors).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
  
  // Also verify radius or other non-color properties if needed
}
