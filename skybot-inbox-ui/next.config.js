const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore build errors
    ignoreBuildErrors: true,
  },
  // Fix for monorepo: tell Next.js the correct output root
  outputFileTracingRoot: path.join(__dirname),
};

module.exports = nextConfig;
