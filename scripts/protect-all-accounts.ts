#!/usr/bin/env ts-node
import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function protectAllAccounts() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL missing');

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('🛡️  Installation de la protection complète des comptes...');

    // Set environment variable for trigger
    const env = process.env.NODE_ENV || 'development';
    await pool.query(`SET app.environment = '${env}'`);

    // Use process.cwd() to get project root (works both in dev and compiled)
    const sqlPath = path.join(process.cwd(), 'prisma/migrations/protect_all_accounts.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Protection installée!');
    console.log('   - GoodLife: JAMAIS supprimable');
    console.log('   - Tous les comptes: Protégés en production');
    console.log('   - Utilisez le statut INACTIVE au lieu de DELETE');

    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await pool.end();
    throw error;
  }
}

protectAllAccounts();
