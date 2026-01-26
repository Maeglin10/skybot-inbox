import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async () => {
  // Hardcoded locale for simplified i18n
  const locale = 'fr';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
