#!/bin/bash

echo "🔍 Quick Production Check - SkyBot Inbox"
echo "=========================================="
echo ""

# Backend health
echo "📡 Backend API:"
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://skybot-inbox.onrender.com/api)
if [ "$BACKEND_STATUS" == "404" ]; then
  echo "   ✅ Backend is UP (404 expected at root)"
else
  echo "   ⚠️  Backend returned: $BACKEND_STATUS"
fi

# Frontend health
echo ""
echo "🌐 Frontend UI:"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://skybot-inbox-ui.onrender.com)
if [ "$FRONTEND_STATUS" == "307" ] || [ "$FRONTEND_STATUS" == "200" ]; then
  echo "   ✅ Frontend is UP"
else
  echo "   ❌ Frontend is DOWN (status: $FRONTEND_STATUS)"
fi

# Login test
echo ""
echo "🔐 Authentication Test:"
LOGIN_RESPONSE=$(curl -s -X POST https://skybot-inbox.onrender.com/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"goodlife.nexxaagents","password":"4qFEZPjc8f"}')

if echo "$LOGIN_RESPONSE" | grep -q "accessToken"; then
  echo "   ✅ Login successful"
  TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')
  
  # Corporate contacts check
  echo ""
  echo "👔 Corporate Contacts:"
  CORP_RESPONSE=$(curl -s https://skybot-inbox.onrender.com/api/corporate-alerts \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$CORP_RESPONSE" | grep -q "total"; then
    COUNT=$(echo "$CORP_RESPONSE" | jq -r '.total')
    echo "   ✅ $COUNT corporate contacts found"
  else
    echo "   ❌ Failed to fetch corporate contacts"
  fi
  
  # System health check
  echo ""
  echo "🏥 System Health:"
  HEALTH_RESPONSE=$(curl -s https://skybot-inbox.onrender.com/api/debug/system-health \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$HEALTH_RESPONSE" | grep -q "accountId"; then
    echo "   ✅ Debug endpoint working"
    echo "   📊 Stats:"
    echo "      - Contacts: $(echo "$HEALTH_RESPONSE" | jq -r '.contacts.total')"
    echo "      - Corporate: $(echo "$HEALTH_RESPONSE" | jq -r '.contacts.corporate')"
    echo "      - Conversations: $(echo "$HEALTH_RESPONSE" | jq -r '.conversations.total')"
    echo "      - Messages (24h): $(echo "$HEALTH_RESPONSE" | jq -r '.messages.last24h')"
  else
    echo "   ⚠️  Debug endpoint not yet deployed"
  fi
  
  # Webhook health
  echo ""
  echo "🪝 Webhook Health:"
  WEBHOOK_RESPONSE=$(curl -s https://skybot-inbox.onrender.com/api/debug/webhook-test \
    -H "Authorization: Bearer $TOKEN")
  
  if echo "$WEBHOOK_RESPONSE" | grep -q "webhooksWorking"; then
    MESSAGES_LAST_HOUR=$(echo "$WEBHOOK_RESPONSE" | jq -r '.recentActivity.messagesLastHour')
    WEBHOOKS_OK=$(echo "$WEBHOOK_RESPONSE" | jq -r '.recentActivity.webhooksWorking')
    echo "   Messages last hour: $MESSAGES_LAST_HOUR"
    if [ "$WEBHOOKS_OK" == "true" ]; then
      echo "   ✅ Webhooks are working"
    else
      echo "   ⚠️  No recent webhook activity"
    fi
  else
    echo "   ⚠️  Webhook endpoint not yet deployed"
  fi
  
else
  echo "   ❌ Login failed"
fi

echo ""
echo "=========================================="
echo "✅ Check complete!"
