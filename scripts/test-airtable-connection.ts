/**
 * Airtable Connection Test Script
 *
 * Tests connection to all required Airtable tables:
 * - clients_config (NEW - payment configuration)
 * - leads (ENRICHED - full CRM fields)
 * - notifications (existing)
 * - feedbacks (existing)
 *
 * Run: npx tsx scripts/test-airtable-connection.ts
 */

import 'dotenv/config';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || '';
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || '';

const REQUIRED_TABLES = [
  'clients_config',
  'leads',
  'notifications',
  'feedbacks',
];

interface TableStatus {
  name: string;
  accessible: boolean;
  recordCount?: number;
  fields?: string[];
  error?: string;
}

async function testTable(tableName: string): Promise<TableStatus> {
  const url = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}?maxRecords=3`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        name: tableName,
        accessible: false,
        error: `HTTP ${response.status}: ${error}`,
      };
    }

    const data = await response.json();
    const records = data.records || [];

    // Extract field names from first record
    const fields = records.length > 0
      ? Object.keys(records[0].fields)
      : [];

    return {
      name: tableName,
      accessible: true,
      recordCount: records.length,
      fields,
    };
  } catch (error: any) {
    return {
      name: tableName,
      accessible: false,
      error: error.message,
    };
  }
}

async function main() {
  console.log('🔍 Testing Airtable Connection...\n');

  if (!AIRTABLE_API_KEY) {
    console.error('❌ AIRTABLE_API_KEY not set in environment');
    process.exit(1);
  }

  if (!AIRTABLE_BASE_ID) {
    console.error('❌ AIRTABLE_BASE_ID not set in environment');
    process.exit(1);
  }

  console.log(`📋 Base ID: ${AIRTABLE_BASE_ID}`);
  console.log(`🔑 API Key: ${AIRTABLE_API_KEY.slice(0, 15)}...`);
  console.log(`\n🔍 Testing ${REQUIRED_TABLES.length} tables...\n`);

  const results: TableStatus[] = [];

  for (const tableName of REQUIRED_TABLES) {
    const status = await testTable(tableName);
    results.push(status);

    if (status.accessible) {
      console.log(`✅ ${status.name}`);
      console.log(`   Records: ${status.recordCount}`);
      console.log(`   Fields: ${status.fields?.length || 0}`);
      if (status.fields && status.fields.length > 0) {
        const displayFields = status.fields.slice(0, 5);
        console.log(`   Sample: ${displayFields.join(', ')}${status.fields.length > 5 ? '...' : ''}`);
      }
    } else {
      console.log(`❌ ${status.name}`);
      console.log(`   Error: ${status.error}`);
    }
    console.log('');
  }

  // Summary
  const accessible = results.filter(r => r.accessible).length;
  const total = results.length;

  console.log('─'.repeat(50));
  console.log(`\n📊 Summary: ${accessible}/${total} tables accessible\n`);

  if (accessible === total) {
    console.log('✨ All tables are accessible! Backend integration ready.\n');
    process.exit(0);
  } else {
    console.log('⚠️  Some tables are not accessible. Check permissions.\n');

    const failed = results.filter(r => !r.accessible);
    console.log('Failed tables:');
    failed.forEach(table => {
      console.log(`  - ${table.name}: ${table.error}`);
    });

    console.log('\n📝 Action items:');
    console.log('1. Go to https://airtable.com/create/tokens');
    console.log(`2. Edit token: ${AIRTABLE_API_KEY.slice(0, 15)}...`);
    console.log('3. Ensure all tables have Read/Write permissions');
    console.log('4. Save and re-run this script\n');

    process.exit(1);
  }
}

main();
