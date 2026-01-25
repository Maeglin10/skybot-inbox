import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  typescript: {
    // Temporarily ignore build errors due to Next.js 16 + Turbopack routing type issues
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
};

export default withNextIntl(nextConfig);