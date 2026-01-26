import type { Metadata } from 'next';
import { Providers } from '@/app/providers';
import { Poppins } from 'next/font/google';
import '../globals.css';
import "../../styles/ui.css";

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
  return (
    <html lang="es" className={`${nxSans.variable} dark`} suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}