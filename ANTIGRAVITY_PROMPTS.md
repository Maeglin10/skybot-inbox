# Prompts Antigravity - Thèmes shadcn-ui + Multi-langue

Ce document contient tous les prompts à utiliser avec Antigravity pour implémenter les thèmes et langues dans le frontend.

---

## 📋 Contexte Backend

L'API backend expose ces endpoints :

**GET** `/api/preferences/:userAccountId`
```json
{
  "id": "cm...",
  "theme": "DEFAULT",
  "language": "EN",
  "timezone": "UTC",
  "dateFormat": "YYYY-MM-DD",
  "timeFormat": "24h",
  "updatedAt": "2026-01-24T10:00:00.000Z"
}
```

**PATCH** `/api/preferences/:userAccountId`
```json
{
  "theme": "DRACULA",
  "language": "FR"
}
```

**Thèmes disponibles** : DEFAULT, NORD, GOLD, NATURE, NETFLIX, LARACON, DRACULA, LIGHT, DARK, SYSTEM

**Langues disponibles** : EN, FR, ES, PT

**Source des thèmes** : https://github.com/luisFilipePT/shadcn-ui-theme-explorer

---

## 🎨 Prompt 1 : Configuration des Thèmes shadcn-ui

```
Je veux intégrer les 7 thèmes de shadcn-ui-theme-explorer dans mon application Next.js avec Tailwind CSS.

CONTEXTE:
- Application Next.js 14+ avec App Router
- shadcn/ui déjà installé
- Tailwind CSS configuré

THÈMES À INTÉGRER (depuis https://github.com/luisFilipePT/shadcn-ui-theme-explorer):

1. DEFAULT - The default shadcn/ui theme
2. NORD - An arctic, north-bluish color palette
3. GOLD - A warm and inviting color palette of rich browns and shimmering golds
4. NATURE - A soothing palette of soft yellows, greens, and blues
5. NETFLIX - A bold color palette of black, white, and fiery red
6. LARACON - A vibrant color palette celebrating Laracon US 2023
7. DRACULA - A dark theme using Dracula colors

REQUIREMENTS:

1. Créer un fichier `lib/themes.ts` qui exporte:
   - Un type TypeScript `Theme` avec tous les noms de thèmes
   - Un objet `themes` contenant les définitions CSS custom properties pour chaque thème
   - Une fonction `applyTheme(theme: Theme)` qui applique le thème sur le document

2. Structure des CSS variables pour chaque thème:
   - Utiliser HSL values comme dans shadcn-ui
   - Variables: --background, --foreground, --muted, --muted-foreground, --popover, --popover-foreground, --border, --input, --card, --card-foreground, --primary, --primary-foreground, --secondary, --secondary-foreground, --accent, --accent-foreground, --destructive, --destructive-foreground, --ring, --radius
   - Supporter mode .light et .dark pour chaque thème

3. Créer un composant `ThemeProvider` (context provider) qui:
   - Stocke le thème actuel dans React Context
   - Persiste le thème dans localStorage
   - Applique automatiquement le thème au montage
   - Expose une fonction `setTheme()` pour changer le thème

4. Créer un composant `ThemeSwitcher` (dropdown ou select) qui:
   - Affiche tous les thèmes disponibles avec leurs descriptions
   - Permet de prévisualiser chaque thème (optionnel)
   - Met à jour le thème via le ThemeProvider
   - Synchronise avec l'API backend (PATCH /api/preferences/:userAccountId)

5. Mettre à jour `globals.css` pour inclure:
   - Les CSS variables de base
   - Le support de data-theme attribute sur :root
   - Les styles dark/light mode

EXEMPLE DE SORTIE ATTENDU:

```typescript
// lib/themes.ts
export const themes = {
  DEFAULT: {
    light: {
      background: "0 0% 100%",
      foreground: "222.2 84% 4.9%",
      // ... autres variables
    },
    dark: {
      background: "222.2 84% 4.9%",
      foreground: "210 40% 98%",
      // ... autres variables
    }
  },
  NORD: { /* ... */ },
  // ... autres thèmes
}

export function applyTheme(theme: Theme, mode: 'light' | 'dark') {
  // Logique d'application
}
```

NOTES:
- Utiliser les vraies valeurs HSL depuis le repo shadcn-ui-theme-explorer
- Assurer la compatibilité avec tous les composants shadcn/ui
- Préférer une approche performante (eviter les re-renders inutiles)
```

---

## 🌍 Prompt 2 : Configuration Multi-langue avec next-i18next

```
Je veux configurer un système de traduction multi-langue dans mon application Next.js avec next-i18next.

CONTEXTE:
- Application Next.js 14+ avec App Router
- Support de 4 langues: EN, FR, ES, PT
- Backend API qui stocke la préférence de langue dans /api/preferences/:userAccountId

REQUIREMENTS:

1. Installer et configurer next-i18next:
   ```bash
   npm install next-i18next react-i18next i18next
   ```

2. Créer la structure de fichiers de traduction:
   ```
   /public/locales/
     ├── en/
     │   ├── common.json
     │   ├── navigation.json
     │   └── settings.json
     ├── fr/
     │   ├── common.json
     │   ├── navigation.json
     │   └── settings.json
     ├── es/
     │   └── ... (même structure)
     └── pt/
         └── ... (même structure)
   ```

3. Créer `next-i18next.config.js` avec:
   - Langues supportées: en, fr, es, pt
   - Langue par défaut: en
   - Detection automatique de la langue du navigateur
   - Fallback sur 'en' si langue non disponible

4. Créer les fichiers de traduction initiaux:

   **en/common.json**:
   ```json
   {
     "welcome": "Welcome",
     "loading": "Loading...",
     "save": "Save",
     "cancel": "Cancel",
     "error": "An error occurred",
     "success": "Success"
   }
   ```

   **en/navigation.json**:
   ```json
   {
     "inbox": "Inbox",
     "crm": "CRM",
     "analytics": "Analytics",
     "alerts": "Alerts",
     "settings": "Settings",
     "orders": "Orders"
   }
   ```

   **en/settings.json**:
   ```json
   {
     "preferences": "Preferences",
     "theme": "Theme",
     "language": "Language",
     "timezone": "Timezone",
     "dateFormat": "Date Format",
     "timeFormat": "Time Format",
     "selectTheme": "Select a theme",
     "selectLanguage": "Select a language"
   }
   ```

   **Puis créer les versions FR, ES, PT avec les traductions appropriées.**

5. Créer un composant `LanguageSwitcher` qui:
   - Affiche la langue actuelle avec un drapeau ou code (EN, FR, ES, PT)
   - Dropdown pour changer de langue
   - Synchronise avec l'API backend (PATCH /api/preferences/:userAccountId)
   - Change la langue via i18n.changeLanguage()

6. Créer un hook personnalisé `useUserPreferences` qui:
   - Fetch les préférences depuis l'API au montage
   - Applique la langue et le thème de l'utilisateur
   - Expose des fonctions updateLanguage() et updateTheme()
   - Gère le loading et les erreurs

EXEMPLE D'UTILISATION:

```typescript
// Dans un composant
import { useTranslation } from 'next-i18next'

function MyComponent() {
  const { t } = useTranslation('common')

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button>{t('save')}</button>
    </div>
  )
}
```

TRADUCTIONS À CRÉER pour chaque langue:

**Français (fr)**:
- welcome → Bienvenue
- inbox → Boîte de réception
- crm → CRM
- analytics → Analytiques
- settings → Paramètres
- theme → Thème
- language → Langue

**Espagnol (es)**:
- welcome → Bienvenido
- inbox → Bandeja de entrada
- crm → CRM
- analytics → Analíticas
- settings → Configuración
- theme → Tema
- language → Idioma

**Portugais (pt)**:
- welcome → Bem-vindo
- inbox → Caixa de entrada
- crm → CRM
- analytics → Análises
- settings → Configurações
- theme → Tema
- language → Idioma

NOTES:
- Utiliser le namespace pattern pour organiser les traductions
- Précharger les traductions nécessaires pour éviter les flashes de contenu
- Support du formatage de dates/heures selon la langue
```

---

## ⚙️ Prompt 3 : Page Settings avec Thèmes + Langues

```
Je veux créer une page Settings complète qui permet de gérer les préférences utilisateur (thème, langue, timezone, formats).

CONTEXTE:
- Thèmes shadcn-ui déjà configurés (voir Prompt 1)
- Multi-langue déjà configuré avec next-i18next (voir Prompt 2)
- Backend API: GET/PATCH /api/preferences/:userAccountId

REQUIREMENTS:

1. Créer une page `app/settings/page.tsx` avec:
   - Layout moderne et responsive
   - Sections séparées pour: Apparence, Langue & Région
   - Utilisation de composants shadcn/ui (Card, Select, Label, Button)

2. Section "Apparence":
   - **Theme Selector**: Dropdown avec les 7 thèmes
     - Afficher le nom et la description de chaque thème
     - Preview visuel optionnel (petits carrés de couleur)
     - Appliquer le thème en temps réel
   - **Mode**: Toggle Light/Dark si applicable au thème sélectionné

3. Section "Langue & Région":
   - **Language Selector**: Dropdown avec EN, FR, ES, PT
     - Drapeaux ou codes pays à côté de chaque option
     - Changer la langue de l'interface immédiatement
   - **Timezone**: Select avec les principales timezones
   - **Date Format**: Select avec formats (YYYY-MM-DD, DD/MM/YYYY, MM/DD/YYYY)
   - **Time Format**: Toggle 12h/24h

4. Fonctionnalités:
   - **Auto-save**: Sauvegarder automatiquement chaque changement via PATCH /api/preferences/:userAccountId
   - **Loading states**: Afficher un skeleton loader pendant le fetch initial
   - **Error handling**: Toast notification en cas d'erreur
   - **Success feedback**: Toast "Preferences saved" après chaque update

5. Utiliser ce hook pour gérer l'état:

```typescript
function usePreferences(userAccountId: string) {
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fetch initial preferences
  useEffect(() => {
    fetch(`/api/preferences/${userAccountId}`)
      .then(res => res.json())
      .then(data => {
        setPreferences(data)
        // Apply theme and language
        applyTheme(data.theme)
        i18n.changeLanguage(data.language.toLowerCase())
      })
      .catch(err => setError(err))
      .finally(() => setLoading(false))
  }, [userAccountId])

  // Update preference
  const updatePreference = async (updates) => {
    try {
      const res = await fetch(`/api/preferences/${userAccountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const updated = await res.json()
      setPreferences(updated)

      // Apply changes immediately
      if (updates.theme) applyTheme(updates.theme)
      if (updates.language) i18n.changeLanguage(updates.language.toLowerCase())

      toast.success('Preferences saved')
    } catch (err) {
      toast.error('Failed to save preferences')
    }
  }

  return { preferences, loading, error, updatePreference }
}
```

DESIGN:
- Style moderne avec glassmorphism ou soft shadows
- Cards avec border subtle
- Espacement généreux entre les sections
- Animations smooth lors des changements de thème
- Responsive (mobile-first)

COMPOSANTS shadcn/ui À UTILISER:
- Card, CardHeader, CardTitle, CardDescription, CardContent
- Select, SelectTrigger, SelectContent, SelectItem
- Label
- Switch (pour 12h/24h toggle)
- Skeleton (pour loading state)
- Toast (pour notifications)
```

---

## 🔄 Prompt 4 : Synchronisation Thème/Langue à travers l'App

```
Je veux que les préférences de thème et langue soient appliquées globalement et persistées à travers toute l'application.

CONTEXTE:
- Next.js App Router
- Thèmes et langues déjà configurés
- API backend pour la persistance

REQUIREMENTS:

1. Créer `app/providers.tsx` qui combine:
   - ThemeProvider (gestion du thème)
   - I18nProvider (gestion des langues)
   - PreferencesProvider (sync avec API)

2. Structure du PreferencesProvider:

```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useTheme } from './theme-provider'
import { useTranslation } from 'react-i18next'

interface PreferencesContextType {
  preferences: UserPreferences | null
  loading: boolean
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>
}

const PreferencesContext = createContext<PreferencesContextType>(null)

export function PreferencesProvider({
  children,
  userAccountId
}: {
  children: React.ReactNode
  userAccountId: string
}) {
  const [preferences, setPreferences] = useState(null)
  const [loading, setLoading] = useState(true)
  const { setTheme } = useTheme()
  const { i18n } = useTranslation()

  // Fetch and apply preferences on mount
  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch(`/api/preferences/${userAccountId}`)
        const data = await res.json()

        setPreferences(data)
        setTheme(data.theme)
        i18n.changeLanguage(data.language.toLowerCase())
      } catch (error) {
        console.error('Failed to load preferences:', error)
      } finally {
        setLoading(false)
      }
    }

    loadPreferences()
  }, [userAccountId])

  const updatePreferences = async (updates) => {
    try {
      const res = await fetch(`/api/preferences/${userAccountId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      const updated = await res.json()

      setPreferences(updated)
      if (updates.theme) setTheme(updates.theme)
      if (updates.language) i18n.changeLanguage(updates.language.toLowerCase())
    } catch (error) {
      throw error
    }
  }

  return (
    <PreferencesContext.Provider value={{ preferences, loading, updatePreferences }}>
      {children}
    </PreferencesContext.Provider>
  )
}

export const usePreferences = () => useContext(PreferencesContext)
```

3. Utiliser dans `app/layout.tsx`:

```typescript
import { PreferencesProvider } from './providers/preferences-provider'
import { ThemeProvider } from './providers/theme-provider'

export default function RootLayout({ children }) {
  const userAccountId = // Get from auth session

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <PreferencesProvider userAccountId={userAccountId}>
            {children}
          </PreferencesProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
```

4. Hook d'utilisation dans les composants:

```typescript
// Dans n'importe quel composant
function MyComponent() {
  const { preferences, updatePreferences } = usePreferences()
  const { t } = useTranslation()

  return (
    <div>
      <p>{t('currentTheme')}: {preferences?.theme}</p>
      <button onClick={() => updatePreferences({ theme: 'DRACULA' })}>
        {t('switchToDracula')}
      </button>
    </div>
  )
}
```

NOTES:
- Gérer les états de chargement avec Suspense
- Prévenir les flashes de contenu non-thématisé (FOUC)
- Synchroniser localStorage avec l'API
- Gérer le cas où l'utilisateur n'est pas authentifié
```

---

## 📝 Checklist d'Implémentation

Utilise ces prompts dans cet ordre avec Antigravity:

- [ ] **Prompt 1**: Configuration des thèmes shadcn-ui
  - Créer lib/themes.ts avec les 7 thèmes
  - Créer ThemeProvider
  - Créer ThemeSwitcher component
  - Mettre à jour globals.css

- [ ] **Prompt 2**: Configuration multi-langue
  - Installer next-i18next
  - Créer les fichiers de traduction (EN, FR, ES, PT)
  - Créer LanguageSwitcher component
  - Configurer next-i18next.config.js

- [ ] **Prompt 3**: Page Settings
  - Créer app/settings/page.tsx
  - Implémenter les sections Apparence et Langue
  - Ajouter auto-save avec l'API
  - Ajouter loading/error states

- [ ] **Prompt 4**: Synchronisation globale
  - Créer PreferencesProvider
  - Intégrer dans app/layout.tsx
  - Tester le changement de thème/langue à travers l'app
  - Vérifier la persistance

---

## 🎯 Résultat Attendu

Après avoir utilisé ces 4 prompts avec Antigravity, tu auras:

✅ 7 thèmes shadcn-ui fonctionnels et switchables
✅ Support de 4 langues (EN, FR, ES, PT) avec traductions
✅ Page Settings complète et responsive
✅ Synchronisation automatique avec le backend
✅ Persistance des préférences utilisateur
✅ Expérience utilisateur fluide sans reloads

**Note**: N'oublie pas de remplacer `userAccountId` par l'ID réel de l'utilisateur connecté (depuis ta session auth).
