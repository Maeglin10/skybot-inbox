import 'dotenv/config';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  duration: number;
  error?: string;
}

const results: TestResult[] = [];
const API_URL = process.env.API_URL || 'http://localhost:3001';

// Test credentials
const ADMIN_CREDS = {
  username: 'valentinmilliand.nexxa',
  password: '4gs75062a6rOnOKy3j09ireEPWAB5Td',
};

const USER_CREDS = {
  username: 'goodlife.nexxaagents',
  password: '***REMOVED***',
};

async function runTest(name: string, testFn: () => Promise<void>) {
  const start = Date.now();
  try {
    await testFn();
    const duration = Date.now() - start;
    results.push({ name, status: 'PASS', duration });
    console.log(`✅ PASS: ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    const errorMsg = error instanceof Error ? error.message : String(error);
    results.push({ name, status: 'FAIL', duration, error: errorMsg });
    console.log(`❌ FAIL: ${name} (${duration}ms)`);
    console.log(`   Error: ${errorMsg}`);
  }
}

async function testHealthEndpoint() {
  const response = await fetch(`${API_URL}/api/health`);
  if (!response.ok) throw new Error(`Health check failed: ${response.status}`);
  const data = await response.json();
  if (data.status !== 'ok') throw new Error('Health status not OK');
}

async function testAdminLogin() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CREDS),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Admin login failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  if (!data.accessToken) throw new Error('No access token returned');
  if (!data.user) throw new Error('No user data returned');
  if (data.user.role !== 'ADMIN') throw new Error('User role is not ADMIN');

  // Store token for next tests
  (global as any).adminToken = data.accessToken;
}

async function testUserLogin() {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(USER_CREDS),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`User login failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  if (!data.accessToken) throw new Error('No access token returned');
  if (!data.user) throw new Error('No user data returned');
  if (data.user.role !== 'USER') throw new Error('User role is not USER');

  // Store token for next tests
  (global as any).userToken = data.accessToken;
}

async function testGetCurrentUser() {
  const token = (global as any).adminToken;
  if (!token) throw new Error('No admin token available');

  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error(`Get me failed: ${response.status}`);
  const data = await response.json();
  if (!data.id) throw new Error('No user ID returned');
  if (data.username !== ADMIN_CREDS.username) {
    throw new Error(`Wrong username: expected ${ADMIN_CREDS.username}, got ${data.username}`);
  }
}

async function testUnauthorizedAccess() {
  const response = await fetch(`${API_URL}/api/auth/me`);
  if (response.status !== 401) {
    throw new Error(`Expected 401, got ${response.status}`);
  }
}

async function testAdminListUsers() {
  const token = (global as any).adminToken;
  if (!token) throw new Error('No admin token available');

  const response = await fetch(`${API_URL}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error(`List users failed: ${response.status}`);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error('Response is not an array');
  if (data.length === 0) throw new Error('No users returned');
}

async function testUserCannotAccessAdmin() {
  const token = (global as any).userToken;
  if (!token) throw new Error('No user token available');

  const response = await fetch(`${API_URL}/api/admin/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  // Should return 403 Forbidden
  if (response.status !== 403 && response.status !== 401) {
    throw new Error(`Expected 403/401, got ${response.status}`);
  }
}

async function testListLeads() {
  const token = (global as any).adminToken;
  if (!token) throw new Error('No admin token available');

  const response = await fetch(`${API_URL}/api/crm/leads`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error(`List leads failed: ${response.status}`);
  const data = await response.json();

  // data might be an array or paginated object
  const items = Array.isArray(data) ? data : (data.items || data.data || []);

  if (items.length === 0) {
    console.log('   ⚠️  Warning: No leads found (might be expected)');
  }
}

async function testListAlerts() {
  const token = (global as any).adminToken;
  if (!token) throw new Error('No admin token available');

  const response = await fetch(`${API_URL}/api/alerts`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error(`List alerts failed: ${response.status}`);
  const data = await response.json();

  // data might be an array or paginated object
  const items = Array.isArray(data) ? data : (data.items || data.data || []);

  if (items.length === 0) {
    console.log('   ⚠️  Warning: No alerts found (might be expected)');
  }
}

async function testMultiTenantIsolation() {
  // Login with admin (Nexxa account)
  const adminResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ADMIN_CREDS),
  });

  const adminData = await adminResponse.json();
  const adminToken = adminData.accessToken;

  // Login with user (GoodLife account)
  const userResponse = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(USER_CREDS),
  });

  const userData = await userResponse.json();
  const userToken = userData.accessToken;

  // Get leads for both accounts
  const adminLeadsResponse = await fetch(`${API_URL}/api/crm/leads`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });

  const userLeadsResponse = await fetch(`${API_URL}/api/crm/leads`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });

  const adminLeads = await adminLeadsResponse.json();
  const userLeads = await userLeadsResponse.json();

  // Verify no overlap in lead IDs
  const adminItems = Array.isArray(adminLeads) ? adminLeads : (adminLeads.items || []);
  const userItems = Array.isArray(userLeads) ? userLeads : (userLeads.items || []);

  const adminIds = adminItems.map((l: any) => l.id);
  const userIds = userItems.map((l: any) => l.id);

  const overlap = adminIds.some((id: string) => userIds.includes(id));

  if (overlap) {
    throw new Error('Multi-tenant isolation broken: found overlapping lead IDs');
  }

  console.log(`   Admin account: ${adminItems.length} leads`);
  console.log(`   User account: ${userItems.length} leads`);
  console.log('   ✓ No overlap detected');
}

async function main() {
  console.log('\n🧪 Running Smoke Tests\n');
  console.log('='.repeat(60));
  console.log(`API URL: ${API_URL}\n`);

  // Run tests sequentially
  await runTest('1. Health Endpoint', testHealthEndpoint);
  await runTest('2. Admin Login', testAdminLogin);
  await runTest('3. User Login', testUserLogin);
  await runTest('4. Get Current User (Authenticated)', testGetCurrentUser);
  await runTest('5. Unauthorized Access (No Token)', testUnauthorizedAccess);
  await runTest('6. Admin Can List Users', testAdminListUsers);
  await runTest('7. User Cannot Access Admin Endpoint', testUserCannotAccessAdmin);
  await runTest('8. List Leads', testListLeads);
  await runTest('9. List Alerts', testListAlerts);
  await runTest('10. Multi-Tenant Isolation', testMultiTenantIsolation);

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');

  const passCount = results.filter(r => r.status === 'PASS').length;
  const failCount = results.filter(r => r.status === 'FAIL').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.name}: ${r.status} (${r.duration}ms)`);
    if (r.error) {
      console.log(`   └─ ${r.error}`);
    }
  });

  console.log(`\nTotal: ${passCount} passed, ${failCount} failed out of ${results.length} tests`);
  console.log(`Duration: ${totalDuration}ms\n`);

  if (failCount > 0) {
    console.log('❌ SMOKE TESTS FAILED - DO NOT DEPLOY\n');
    process.exit(1);
  } else {
    console.log('✅ ALL SMOKE TESTS PASSED - READY FOR PRODUCTION\n');
    process.exit(0);
  }
}

main().catch(error => {
  console.error('\n💥 Fatal error running smoke tests:', error);
  process.exit(1);
});
