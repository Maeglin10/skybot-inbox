import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import { Poppins } from 'next/font/google';
import '../globals.css';
import "../../styles/ui.css";
import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';

const nxSans = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--nx-font-sans',
});

export const metadata: Metadata = {
  title: 'Nexxa Agent Inbox',
  description: 'Nexxa Agent Inbox',
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${nxSans.variable} dark`} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}