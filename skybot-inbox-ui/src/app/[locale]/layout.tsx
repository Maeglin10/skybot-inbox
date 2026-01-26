import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import { Poppins } from 'next/font/google';
import '../globals.css';
import "../../styles/ui.css";
import { NextIntlClientProvider } from 'next-intl';
import frMessages from '../../../messages/fr.json';

const nxSans = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--nx-font-sans',
});

export const metadata: Metadata = {
  title: 'Nexxa Agent Inbox',
  description: 'Nexxa Agent Inbox',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Hardcoded locale and messages for simplified i18n
  const locale = 'fr';

  return (
    <html lang={locale} className={`${nxSans.variable} dark`} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={frMessages} locale={locale}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}