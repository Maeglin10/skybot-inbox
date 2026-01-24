#!/usr/bin/env tsx
/**
 * Backend & Frontend Audit Script
 * Tests connectivity and identifies missing pieces
 */

import { config } from 'dotenv';
import Airtable from 'airtable';

config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const API_KEY = process.env.API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;

console.log('🔍 Backend & Frontend Audit\n');

// ==================== AIRTABLE TESTS ====================
async function testAirtableConnection() {
  console.log('📊 Testing Airtable Connection...');

  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    console.error('❌ AIRTABLE_API_KEY or AIRTABLE_BASE_ID not configured');
    return false;
  }

  try {
    Airtable.configure({ apiKey: AIRTABLE_API_KEY });
    const base = Airtable.base(AIRTABLE_BASE_ID);

    // Test fetching tables
    const tables = ['Leads', 'Feedbacks', 'Notifications', 'client_config'];

    for (const tableName of tables) {
      try {
        const records = await base(tableName)
          .select({ maxRecords: 1 })
          .firstPage();
        console.log(`✅ Table "${tableName}": ${records.length > 0 ? 'Has data' : 'Empty'}`);
      } catch (error: any) {
        console.error(`❌ Table "${tableName}": ${error.message}`);
      }
    }

    return true;
  } catch (error: any) {
    console.error('❌ Airtable connection failed:', error.message);
    return false;
  }
}

// ==================== BACKEND API TESTS ====================
async function testBackendEndpoints() {
  console.log('\n🚀 Testing Backend Endpoints...');

  const endpoints = [
    { method: 'GET', path: '/api/health', auth: false },
    { method: 'GET', path: '/api/auth/me', auth: true },
    { method: 'GET', path: '/api/conversations?accountId=test', auth: true },
    { method: 'GET', path: '/api/analytics/dashboard?clientKey=nexxa', auth: true },
    { method: 'GET', path: '/api/crm/leads?clientKey=nexxa', auth: true },
    { method: 'GET', path: '/api/alerts?clientKey=nexxa', auth: true },
  ];

  for (const endpoint of endpoints) {
    try {
      const headers: any = { 'Content-Type': 'application/json' };
      if (endpoint.auth && API_KEY) {
        headers['Authorization'] = `Bearer ${API_KEY}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers,
      });

      const status = response.status;
      const statusIcon = status < 400 ? '✅' : '❌';
      console.log(`${statusIcon} ${endpoint.method} ${endpoint.path}: ${status}`);

      if (status >= 500) {
        const text = await response.text();
        console.log(`   Error: ${text.substring(0, 100)}...`);
      }
    } catch (error: any) {
      console.error(`❌ ${endpoint.method} ${endpoint.path}: ${error.message}`);
    }
  }
}

// ==================== DATABASE TESTS ====================
async function testDatabaseSchema() {
  console.log('\n💾 Testing Database Schema...');

  // Check critical tables via API
  const criticalModels = [
    'UserAccount',
    'UserPreference',
    'Account',
    'Inbox',
    'Conversation',
    'Message',
    'Lead',
    'Feedback',
    'Alert',
    'MagicLink',
  ];

  console.log(`📋 Expected models: ${criticalModels.join(', ')}`);
  console.log('   (Database connectivity check via API calls above)');
}

// ==================== ENVIRONMENT CHECK ====================
function checkEnvironmentVariables() {
  console.log('\n🔐 Checking Environment Variables...');

  const requiredVars = {
    'DATABASE_URL': process.env.DATABASE_URL,
    'AIRTABLE_API_KEY': process.env.AIRTABLE_API_KEY,
    'AIRTABLE_BASE_ID': process.env.AIRTABLE_BASE_ID,
    'JWT_SECRET': process.env.JWT_SECRET,
    'JWT_REFRESH_SECRET': process.env.JWT_REFRESH_SECRET,
    'FRONTEND_URL': process.env.FRONTEND_URL,
  };

  const optionalVars = {
    'GOOGLE_CLIENT_ID': process.env.GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': process.env.GOOGLE_CLIENT_SECRET,
    'OPENAI_API_KEY': process.env.OPENAI_API_KEY,
  };

  console.log('\nRequired Variables:');
  for (const [key, value] of Object.entries(requiredVars)) {
    const status = value && value !== 'your-super-secret-jwt-key-change-in-production' ? '✅' : '❌';
    const display = value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'NOT SET';
    console.log(`${status} ${key}: ${display}`);
  }

  console.log('\nOptional Variables:');
  for (const [key, value] of Object.entries(optionalVars)) {
    const status = value && value !== 'your-google-client-id' ? '✅' : '⚠️';
    const display = value ? (value.length > 20 ? `${value.substring(0, 20)}...` : value) : 'NOT SET';
    console.log(`${status} ${key}: ${display}`);
  }
}

// ==================== MISSING FEATURES CHECK ====================
function checkMissingFeatures() {
  console.log('\n🔍 Checking Missing/Incomplete Features...');

  const features = [
    {
      name: 'Payment Processing Nodes (Orders Agent)',
      status: '❌ NOT IMPLEMENTED',
      details: 'client_config table missing payment fields (stripe_api_key, paypal_email, etc.)',
      priority: 'HIGH',
    },
    {
      name: 'Google OAuth Configuration',
      status: process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id' ? '✅ CONFIGURED' : '⚠️ PLACEHOLDER',
      details: 'Google OAuth credentials need to be configured for production',
      priority: 'MEDIUM',
    },
    {
      name: 'Email Service (Magic Links)',
      status: '❌ NOT IMPLEMENTED',
      details: 'Magic links printed to console, no email service configured',
      priority: 'MEDIUM',
    },
    {
      name: 'JWT Secrets Production',
      status: process.env.JWT_SECRET !== 'your-super-secret-jwt-key-change-in-production' ? '✅ CUSTOM' : '⚠️ DEFAULT',
      details: 'JWT secrets should be changed in production',
      priority: 'HIGH',
    },
    {
      name: 'Frontend Theme Integration',
      status: '⚠️ PARTIAL',
      details: 'Themes defined, needs testing in production',
      priority: 'LOW',
    },
    {
      name: 'Frontend Multi-language',
      status: '⚠️ PARTIAL',
      details: 'i18n setup documented, needs implementation verification',
      priority: 'LOW',
    },
  ];

  for (const feature of features) {
    console.log(`\n${feature.status} ${feature.name}`);
    console.log(`   ${feature.details}`);
    console.log(`   Priority: ${feature.priority}`);
  }
}

// ==================== MAIN ====================
async function main() {
  console.log('Starting audit...\n');

  checkEnvironmentVariables();

  const airtableOk = await testAirtableConnection();

  await testBackendEndpoints();

  await testDatabaseSchema();

  checkMissingFeatures();

  console.log('\n✨ Audit Complete!\n');
  console.log('📝 Summary:');
  console.log('   - Airtable: ' + (airtableOk ? '✅ Connected' : '❌ Issues found'));
  console.log('   - Backend: Check endpoint results above');
  console.log('   - Missing: See features list above');
  console.log('\n🔗 Next Steps:');
  console.log('   1. Fix any ❌ errors found above');
  console.log('   2. Implement missing HIGH priority features');
  console.log('   3. Test frontend integration');
}

main().catch(console.error);
