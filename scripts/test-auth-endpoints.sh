#!/bin/bash

echo "🔐 Testing Auth Endpoints"
echo "========================="
echo ""

# Test 1: Register
echo "1️⃣ Testing Registration..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test-user@nexxa.com","password":"TestPassword123","name":"Test User","accountId":"test-account"}')

if echo "$REGISTER_RESPONSE" | jq -e '.accessToken' > /dev/null 2>&1; then
  echo "✅ Registration successful"
else
  echo "❌ Registration failed:"
  echo "$REGISTER_RESPONSE" | jq '.'
fi
echo ""

# Test 2: Login
echo "2️⃣ Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"valentin@nexxa.com","password":"SecurePassword123"}')

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken')

if [ "$ACCESS_TOKEN" != "null" ] && [ -n "$ACCESS_TOKEN" ]; then
  echo "✅ Login successful"
  echo "Token (first 50 chars): ${ACCESS_TOKEN:0:50}..."
else
  echo "❌ Login failed:"
  echo "$LOGIN_RESPONSE" | jq '.'
  exit 1
fi
echo ""

# Test 3: Get Current User
echo "3️⃣ Testing /api/auth/me..."
ME_RESPONSE=$(curl -s http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$ME_RESPONSE" | jq -e '.email' > /dev/null 2>&1; then
  echo "✅ /api/auth/me successful"
  echo "$ME_RESPONSE" | jq '{id, email, name, role}'
else
  echo "❌ /api/auth/me failed:"
  echo "$ME_RESPONSE" | jq '.'
fi
echo ""

# Test 4: Test Protected Route (conversations)
echo "4️⃣ Testing Protected Route /api/conversations..."
CONV_RESPONSE=$(curl -s http://localhost:3001/api/conversations \
  -H "Authorization: Bearer $ACCESS_TOKEN")

if echo "$CONV_RESPONSE" | jq -e '.items' > /dev/null 2>&1; then
  echo "✅ Protected route accessible with JWT"
  CONV_COUNT=$(echo "$CONV_RESPONSE" | jq '.items | length')
  echo "Found $CONV_COUNT conversations"
else
  echo "⚠️ Protected route response:"
  echo "$CONV_RESPONSE" | jq '.' 2>/dev/null || echo "$CONV_RESPONSE"
fi
echo ""

echo "✨ Auth tests complete!"
