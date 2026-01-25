#!/usr/bin/env tsx
/**
 * List All Airtable Tables and Fields
 * Uses the Airtable Meta API to list all tables in the base
 */

import 'dotenv/config';

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  console.error('❌ AIRTABLE_API_KEY or AIRTABLE_BASE_ID not configured');
  process.exit(1);
}

async function listTables() {
  console.log('📊 Listing all Airtable tables and fields\n');
  console.log(`Base ID: ${AIRTABLE_BASE_ID}\n`);

  try {
    // Use Airtable Meta API to get schema
    const response = await fetch(
      `https://api.airtable.com/v0/meta/bases/${AIRTABLE_BASE_ID}/tables`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to fetch tables:', error);
      process.exit(1);
    }

    const data = await response.json();

    if (!data.tables || data.tables.length === 0) {
      console.log('⚠️ No tables found in this base');
      return;
    }

    console.log(`✅ Found ${data.tables.length} tables:\n`);

    data.tables.forEach((table: any, index: number) => {
      console.log(`${index + 1}. 📋 ${table.name} (ID: ${table.id})`);
      console.log(`   Fields (${table.fields.length}):`);

      table.fields.forEach((field: any) => {
        const typeInfo = field.type === 'multipleSelects' || field.type === 'singleSelect'
          ? ` → Options: [${field.options?.choices?.map((c: any) => c.name).join(', ') || 'none'}]`
          : '';
        console.log(`   - ${field.name} (${field.type})${typeInfo}`);
      });

      console.log('');
    });

    // Check for missing tables
    const tableNames = data.tables.map((t: any) => t.name);
    const expectedTables = ['Leads', 'Feedbacks', 'Notifications', 'client_config'];
    const missingTables = expectedTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      console.log('\n⚠️ Missing Expected Tables:');
      missingTables.forEach(table => {
        console.log(`   - ${table} (needs to be created)`);
      });
    }

    console.log('\n✅ Available tables:', tableNames.join(', '));

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

listTables();
