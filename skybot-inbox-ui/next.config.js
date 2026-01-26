const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore build errors
    ignoreBuildErrors: true,
  },
  // Fix for monorepo: tell Next.js to use skybot-inbox-ui as root
  experimental: {
    outputFileTracingRoot: path.join(__dirname),
  }
};

module.exports = nextConfig;
