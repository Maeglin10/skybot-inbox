#!/usr/bin/env ts-node
import 'dotenv/config';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

async function protectGoodLife() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL missing');

  const pool = new Pool({ connectionString: databaseUrl });

  try {
    console.log('🛡️  Installation de la protection GoodLife...');

    const sqlPath = path.join(__dirname, '../prisma/migrations/protect_goodlife.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    await pool.query(sql);

    console.log('✅ Protection installée! GoodLife ne peut plus être supprimé.');
    console.log('   Toute tentative de suppression sera bloquée avec une erreur.');

    await pool.end();
  } catch (error) {
    console.error('❌ Erreur:', error);
    await pool.end();
    throw error;
  }
}

protectGoodLife();
