#!/usr/bin/env node

/**
 * Fix Failed Migration Script
 *
 * This script removes the failed migration entry from _prisma_migrations table
 * allowing subsequent migrations to proceed.
 */

const { Client } = require('pg');

async function fixFailedMigration() {
  // Get DATABASE_URL from environment
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.log('⚠️  DATABASE_URL not set, skipping migration fix');
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    await client.connect();
    console.log('🔧 Checking for failed migration: 20260124063500_remove_legacy_themes');

    // Delete the failed migration entry
    const result = await client.query(`
      DELETE FROM "_prisma_migrations"
      WHERE migration_name = '20260124063500_remove_legacy_themes'
      AND finished_at IS NULL
      RETURNING migration_name;
    `);

    if (result.rowCount > 0) {
      console.log('✅ Removed failed migration entry:', result.rows[0].migration_name);
    } else {
      console.log('ℹ️  No failed migration found (already resolved)');
    }

  } catch (error) {
    console.error('❌ Error fixing migration:', error.message);
    // Don't fail the build if table doesn't exist yet
    if (error.message.includes('does not exist')) {
      console.log('ℹ️  Migration table not found yet (first deploy)');
      return;
    }
    throw error;
  } finally {
    await client.end();
  }
}

fixFailedMigration()
  .then(() => {
    console.log('✅ Migration fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Migration fix failed:', error);
    process.exit(1);
  });
