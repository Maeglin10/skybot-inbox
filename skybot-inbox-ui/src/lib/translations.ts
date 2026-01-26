// Simple Spanish translations - no i18n library needed
const translations = {
  navigation: {
    dashboard: 'Panel',
    inbox: 'Bandeja de entrada',
    alerts: 'Alertas',
    analytics: 'Analíticas',
    calendar: 'Calendario',
    crm: 'CRM',
    settings: 'Configuración',
    account: 'Cuenta',
  },
  settings: {
    title: 'Configuración',
    preferences: 'Preferencias',
    general: 'General',
    profile: 'Perfil',
    appearance: 'Apariencia',
    security: 'Seguridad',
    billing: 'Facturación',
    integrations: 'Integraciones',
    language: 'Idioma',
    legal: 'Legal',
    theme: 'Tema',
    selectTheme: 'Seleccionar tema',
    selectLanguage: 'Seleccionar idioma',
    timezone: 'Zona horaria',
    dateFormat: 'Formato de fecha',
    timeFormat: 'Formato de hora',
  },
  appearance: {
    title: 'Apariencia',
    description: 'Personaliza la apariencia de la aplicación',
    theme: 'Tema',
    themeDescription: 'Selecciona el tema de la aplicación',
  },
  languagePage: {
    title: 'Idioma',
    description: 'Selecciona tu idioma preferido',
    selectLanguage: 'Seleccionar idioma',
  },
  common: {
    save: 'Guardar',
    cancel: 'Cancelar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
  },
};

type TranslationNamespace = keyof typeof translations;
type TranslationKey<T extends TranslationNamespace> = keyof typeof translations[T];

// Simple hook to replace useTranslations from next-intl
export function useTranslations<T extends TranslationNamespace>(namespace: T) {
  return (key: TranslationKey<T>) => {
    const value = translations[namespace][key];
    return typeof value === 'string' ? value : String(key);
  };
}
