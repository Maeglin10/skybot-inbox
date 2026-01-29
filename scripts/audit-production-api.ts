#!/usr/bin/env ts-node
import 'dotenv/config';

const BACKEND_URL = 'https://skybot-inbox.onrender.com/api';

async function auditProductionAPI() {
  console.log('\n🔍 AUDIT DE LA PRODUCTION VIA API\n');
  console.log('Backend URL:', BACKEND_URL);
  console.log('='.repeat(60));

  try {
    // 1. LOGIN AS GOODLIFE
    console.log('\n👤 1. LOGIN GOODLIFE');
    console.log('-'.repeat(60));

    const loginResponse = await fetch(`${BACKEND_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'goodlife.nexxaagents',
        password: '4qFEZPjc8f',
      }),
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', loginResponse.status);
      const error = await loginResponse.text();
      console.error('Error:', error);
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.accessToken;
    const user = loginData.user;

    console.log('✅ Login successful');
    console.log(`   User: ${user.email}`);
    console.log(`   Account ID: ${user.accountId}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Token: ${token.substring(0, 30)}...`);

    // 2. CHECK CONVERSATIONS
    console.log('\n\n💬 2. CONVERSATIONS');
    console.log('-'.repeat(60));

    const conversationsResponse = await fetch(`${BACKEND_URL}/conversations`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (conversationsResponse.ok) {
      const conversationsData = await conversationsResponse.json();
      console.log(`✅ Total conversations: ${conversationsData.data?.length || 0}`);

      if (conversationsData.data && conversationsData.data.length > 0) {
        console.log('\nPremières conversations:');
        conversationsData.data.slice(0, 5).forEach((conv: any, i: number) => {
          console.log(`\n   ${i + 1}. ${conv.contact?.name || 'Unknown'}`);
          console.log(`      Phone: ${conv.contact?.phone}`);
          console.log(`      Status: ${conv.status}`);
          console.log(`      Last message: ${conv.lastMessage?.content?.substring(0, 50) || 'N/A'}`);
        });
      }
    } else {
      console.error('❌ Failed to fetch conversations:', conversationsResponse.status);
    }

    // 3. CHECK CONTACTS
    console.log('\n\n📇 3. CONTACTS');
    console.log('-'.repeat(60));

    const contactsResponse = await fetch(`${BACKEND_URL}/contacts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (contactsResponse.ok) {
      const contactsData = await contactsResponse.json();
      console.log(`✅ Total contacts: ${contactsData.data?.length || 0}`);
    } else {
      console.error('❌ Failed to fetch contacts:', contactsResponse.status);
    }

    // 4. CHECK CORPORATE ALERTS
    console.log('\n\n🏢 4. CORPORATE ALERTS');
    console.log('-'.repeat(60));

    const corporateAlertsResponse = await fetch(
      `${BACKEND_URL}/alerts/corporate`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (corporateAlertsResponse.ok) {
      const corporateAlertsData = await corporateAlertsResponse.json();
      console.log(`✅ Total corporate alerts: ${corporateAlertsData.data?.length || 0}`);

      if (corporateAlertsData.data && corporateAlertsData.data.length > 0) {
        console.log('\nCorporate alerts:');
        corporateAlertsData.data.forEach((alert: any, i: number) => {
          console.log(`\n   ${i + 1}. ${alert.title || alert.contact?.name}`);
          console.log(`      Phone: ${alert.contact?.phone}`);
          console.log(`      Status: ${alert.status}`);
          console.log(`      Type: ${alert.type}`);
        });
      } else {
        console.log('\n⚠️  Aucun corporate alert trouvé!');
      }
    } else {
      console.error(
        '❌ Failed to fetch corporate alerts:',
        corporateAlertsResponse.status,
      );
      const errorText = await corporateAlertsResponse.text();
      console.error('Error:', errorText);
    }

    // 5. CHECK INBOXES
    console.log('\n\n📥 5. INBOXES');
    console.log('-'.repeat(60));

    const inboxesResponse = await fetch(`${BACKEND_URL}/inboxes`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (inboxesResponse.ok) {
      const inboxesData = await inboxesResponse.json();
      console.log(`✅ Total inboxes: ${inboxesData.data?.length || 0}`);

      if (inboxesData.data && inboxesData.data.length > 0) {
        inboxesData.data.forEach((inbox: any) => {
          console.log(`\n   ${inbox.name}`);
          console.log(`      Channel: ${inbox.channel}`);
          console.log(`      External ID: ${inbox.externalId}`);
        });
      }
    } else {
      console.error('❌ Failed to fetch inboxes:', inboxesResponse.status);
    }

    // 6. CHECK USER PREFERENCES
    console.log('\n\n⚙️  6. USER PREFERENCES');
    console.log('-'.repeat(60));

    const preferencesResponse = await fetch(
      `${BACKEND_URL}/user-preferences`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    );

    if (preferencesResponse.ok) {
      const preferencesData = await preferencesResponse.json();
      console.log('✅ User preferences:');
      console.log(`   Theme: ${preferencesData.theme}`);
      console.log(`   Language: ${preferencesData.language}`);
      console.log(`   Timezone: ${preferencesData.timezone}`);
    } else {
      console.error('❌ Failed to fetch preferences:', preferencesResponse.status);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ AUDIT API TERMINÉ\n');
  } catch (error) {
    console.error('\n❌ ERREUR:', error);
  }
}

auditProductionAPI();
