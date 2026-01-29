// Load dotenv only if available (optional for Prisma CLI commands)
try {
  require('dotenv/config');
} catch {
  // dotenv not available, use environment variables directly
}

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
    // directUrl: env('DIRECT_DATABASE_URL'), // si tu l'utilises
  },
});
