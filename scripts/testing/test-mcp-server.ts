#!/usr/bin/env tsx
/**
 * Test MCP Server Communication
 * Tests if the Airtable MCP server responds correctly to MCP protocol
 */

import { spawn } from 'child_process';
import { config } from 'dotenv';

config();

const server = spawn('node', [
  '/Users/milliandvalentin/skybot-inbox/mcp-server-airtable/dist/index.js'
], {
  env: {
    ...process.env,
    AIRTABLE_API_KEY: process.env.AIRTABLE_API_KEY,
    AIRTABLE_BASE_ID: process.env.AIRTABLE_BASE_ID,
  },
  stdio: ['pipe', 'pipe', 'pipe'],
});

console.log('🔍 Testing MCP Server...\n');

// Listen to stderr for server logs
server.stderr.on('data', (data) => {
  console.log('📋 Server log:', data.toString());
});

// Listen to stdout for MCP responses
server.stdout.on('data', (data) => {
  console.log('📨 Server response:', data.toString());
});

// Send a tools/list request (MCP protocol)
const listToolsRequest = {
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list',
  params: {},
};

console.log('📤 Sending tools/list request...');
server.stdin.write(JSON.stringify(listToolsRequest) + '\n');

// Wait for response
setTimeout(() => {
  console.log('\n⏱️ Closing server after 3 seconds...');
  server.kill();
  process.exit(0);
}, 3000);

server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`\n✅ Server exited with code ${code}`);
});
