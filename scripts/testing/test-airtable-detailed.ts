#!/usr/bin/env tsx
/**
 * Detailed Airtable Connection Test
 * Tests access to all tables and lists available fields
 */

import 'dotenv/config';
import Airtable from 'airtable';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ AIRTABLE_API_KEY or AIRTABLE_BASE_ID not configured');
  process.exit(1);
}

Airtable.configure({ apiKey: AIRTABLE_API_KEY });
const base = Airtable.base(AIRTABLE_BASE_ID);

const tables = ['Leads', 'Feedbacks', 'Notifications', 'client_config'];

async function testTable(tableName: string) {
  console.log(`\n📋 Testing table: ${tableName}`);
  console.log('─'.repeat(50));

  try {
    const records = await base(tableName)
      .select({ maxRecords: 3 })
      .firstPage();

    console.log(`✅ Status: Accessible`);
    console.log(`📊 Records found: ${records.length}`);

    if (records.length > 0) {
      const fields = Object.keys(records[0].fields);
      console.log(`📝 Fields (${fields.length}):`, fields.join(', '));

      // Show first record as sample
      console.log('\n🔍 Sample record:');
      console.log(JSON.stringify(records[0].fields, null, 2));
    } else {
      console.log('⚠️ Table is empty');
    }

    return { success: true, count: records.length };
  } catch (error: any) {
    console.log(`❌ Status: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🔍 Detailed Airtable Connection Test\n');
  console.log(`API Key: ${AIRTABLE_API_KEY?.substring(0, 20)}...`);
  console.log(`Base ID: ${AIRTABLE_BASE_ID}\n`);

  const results = [];

  for (const tableName of tables) {
    const result = await testTable(tableName);
    results.push({ table: tableName, ...result });
  }

  console.log('\n\n📊 Summary');
  console.log('═'.repeat(50));
  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    const details = result.success
      ? `${result.count} records`
      : result.error;
    console.log(`${status} ${result.table}: ${details}`);
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(`\n✨ ${successCount}/${tables.length} tables accessible`);

  if (successCount < tables.length) {
    console.log('\n⚠️ Missing Tables or Permissions:');
    results
      .filter((r) => !r.success)
      .forEach((r) => {
        console.log(`   - ${r.table}: ${r.error}`);
      });
  }
}

main().catch(console.error);
