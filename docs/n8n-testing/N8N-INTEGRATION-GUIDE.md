# N8N Integration Guide

Complete guide for understanding, testing, and troubleshooting the N8N integration in SkyBot Inbox.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Environment Setup](#environment-setup)
4. [Message Flow](#message-flow)
5. [Testing Procedures](#testing-procedures)
6. [Troubleshooting](#troubleshooting)
7. [API Reference](#api-reference)

---

## Overview

SkyBot Inbox integrates with N8N to provide intelligent workflow automation for WhatsApp messages. The system routes incoming messages to N8N workflows, processes them using AI agents, and returns responses.

### Key Features

- **Automated Message Routing**: Incoming WhatsApp messages are automatically routed to N8N master router
- **50+ Agent Templates**: Pre-built templates for sales, support, intelligence, HR, finance, legal, and more
- **Multi-Tenant Support**: Each client gets isolated agents and workflows
- **Real-Time Metrics**: Track execution count, error rates, processing times, and costs
- **WebSocket Updates**: Real-time status updates for agent executions
- **Comprehensive Logging**: Full audit trail of all agent executions and routing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    WhatsApp Business API                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓ POST /webhooks/whatsapp
        ┌────────────────────────────────┐
        │ WebhooksController             │
        │ - WhatsAppSignatureGuard       │
        │ - Validates HMAC-SHA256        │
        └────────────────┬───────────────┘
                         │
                         ↓
        ┌────────────────────────────────┐
        │ WebhooksService                │
        │ - Resolve account from phone   │
        │ - Store message in DB          │
        │ - Create RoutingLog            │
        └────────────────┬───────────────┘
                         │
                         ↓
        ┌────────────────────────────────┐
        │ AgentsService.trigger()        │
        │ - Build N8N payload            │
        │ - POST to N8N Master Router    │
        │ - Timeout: 120 seconds         │
        └────────────────┬───────────────┘
                         │
                         ↓
    ┌────────────────────────────────────────┐
    │     N8N Master Router Workflow          │
    │                                        │
    │ 1. Receive webhook                     │
    │ 2. Validate x-webhook-secret           │
    │ 3. Route to appropriate agent          │
    │ 4. Execute Claude AI processing        │
    │ 5. Call APIs (Airtable, CRM, etc.)     │
    │ 6. Return response                     │
    └────────────────┬───────────────────────┘
                     │
                     ↓ POST /webhooks/skybot/agent-execution
    ┌────────────────────────────────────────┐
    │ SkybotWebhooksController               │
    │ - Log execution in AgentLog            │
    │ - Update agent metrics                 │
    │ - Emit WebSocket event                 │
    │ - Update RoutingLog status             │
    └────────────────────────────────────────┘
```

---

## Environment Setup

### Required Environment Variables

```bash
# N8N Master Router Configuration
N8N_MASTER_ROUTER_URL=https://your-n8n-instance.com/webhook/whatsapp-master-webhook
N8N_MASTER_ROUTER_SECRET=your_shared_secret_here
N8N_MASTER_ROUTER_NAME=AUTH-INBOX-N8N

# SkyBot API (Agent Deployment Service)
SKYBOT_API_URL=http://localhost:8080
SKYBOT_API_KEY=your_skybot_api_key_here

# SkyBot Webhook Secret (for callbacks)
SKYBOT_WEBHOOK_SECRET=your_skybot_webhook_secret_here

# Optional: OpenAI for agent processing
OPENAI_API_KEY=sk-...
```

### Verification

Test that environment variables are correctly set:

```bash
# Check if N8N Master Router URL is accessible
curl -X POST $N8N_MASTER_ROUTER_URL \
  -H "x-webhook-secret: $N8N_MASTER_ROUTER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-123",
    "conversationId": "conv-123",
    "messageId": "msg-123",
    "agentKey": "master-router",
    "inputText": "Hello, this is a test message",
    "timestamp": "2026-01-29T00:00:00Z"
  }'

# Expected response: 200 OK with agent response
```

---

## Message Flow

### 1. Incoming WhatsApp Message

When a user sends a WhatsApp message:

1. **Meta sends webhook** to `POST /webhooks/whatsapp`
2. **Signature validation** using WhatsAppSignatureGuard
3. **Message parsing** extracts: phone number, text, media, timestamp
4. **Database operations** (in transaction):
   - Upsert Inbox (WhatsApp phone number)
   - Upsert Contact (sender)
   - Upsert Conversation
   - Create Message with `direction: "IN"`
   - Create RoutingLog with `status: "RECEIVED"`

### 2. Routing to N8N

After storing the message:

1. **Trigger N8N** via `AgentsService.trigger()`
2. **Build payload**:
```json
{
  "requestId": "uuid-v4",
  "conversationId": "cuid",
  "messageId": "cuid",
  "agentKey": "master-router",
  "inputText": "User message text",
  "timestamp": "2026-01-29T00:00:00.000Z"
}
```
3. **HTTP POST** to `N8N_MASTER_ROUTER_URL`
4. **Headers**:
   - `Content-Type: application/json`
   - `x-webhook-secret: {N8N_MASTER_ROUTER_SECRET}`

### 3. N8N Processing

Inside the N8N workflow:

1. **Validate webhook secret**
2. **Load conversation context** from database
3. **Route based on message type**:
   - Sales inquiry → Sales agent
   - Support question → Support agent
   - Corporate number → Internal routing
   - Default → Master router
4. **Execute Claude AI** with context
5. **Make API calls** (Airtable, CRM, etc.)
6. **Format response**
7. **Callback** to SkyBot Inbox

### 4. Response Handling

N8N calls back to:

```http
POST /api/webhooks/skybot/agent-execution
Content-Type: application/json
x-skybot-secret: {SKYBOT_WEBHOOK_SECRET}

{
  "agentId": "agent-cuid",
  "executionStatus": "SUCCESS",
  "inputMessage": "User message",
  "outputMessage": "AI response",
  "processingTimeMs": 1234,
  "openaiTokensUsed": 150,
  "openaiCostUsd": 0.002
}
```

SkyBot Inbox:
1. **Creates AgentLog** entry
2. **Updates agent metrics** (execution count, error count)
3. **Emits WebSocket event** to frontend
4. **Updates RoutingLog** status to `PROCESSED`

---

## Testing Procedures

### Test 1: End-to-End WhatsApp Message Flow

**Objective**: Verify complete message flow from WhatsApp → N8N → Response

**Prerequisites**:
- WhatsApp Business API configured
- N8N Master Router running
- SkyBot Inbox deployed

**Steps**:

1. **Send test message** from WhatsApp:
```
Hello, I'm interested in your services
```

2. **Check logs** in SkyBot Inbox:
```bash
# View recent logs
tail -f /var/log/skybot-inbox.log | grep -i "routing\|n8n\|agent"
```

Expected output:
```
[WebhooksService] Processing WhatsApp webhook
[WebhooksService] Triggering N8N for conversation xyz
[AgentsService] Triggering N8N master router for agent: master-router
[AgentsService] N8N response received in 1234ms
```

3. **Verify database entries**:
```sql
-- Check message was stored
SELECT * FROM "Message"
WHERE text LIKE '%interested in your services%'
ORDER BY "createdAt" DESC LIMIT 1;

-- Check routing log
SELECT * FROM "RoutingLog"
WHERE status = 'PROCESSED'
ORDER BY "createdAt" DESC LIMIT 1;

-- Check agent log
SELECT * FROM "AgentLog"
WHERE "executionStatus" = 'SUCCESS'
ORDER BY timestamp DESC LIMIT 1;
```

4. **Verify WhatsApp response**:
   - User should receive automated response within 5 seconds
   - Response should be contextually relevant

**Success Criteria**:
- ✅ Message stored in database
- ✅ RoutingLog created with status `PROCESSED`
- ✅ AgentLog created with `SUCCESS` status
- ✅ User receives response in WhatsApp
- ✅ No errors in logs

---

### Test 2: Agent Deployment

**Objective**: Deploy a new agent to N8N

**Steps**:

1. **Get auth token**:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "goodlife.nexxaagents",
    "password": "4qFEZPjc8f"
  }'

# Extract accessToken from response
TOKEN="eyJhbGc..."
```

2. **Create agent**:
```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templatePath": "templates/sales/lead-scorer.json",
    "agentName": "Lead Scorer - GoodLife",
    "agentType": "SALES",
    "configJson": {
      "threshold": 7,
      "notifyOnHighScore": true
    }
  }'
```

Expected response:
```json
{
  "id": "cm4xyz...",
  "accountId": "acc-xyz...",
  "agentName": "Lead Scorer - GoodLife",
  "status": "DEPLOYING",
  "templatePath": "templates/sales/lead-scorer.json"
}
```

3. **Wait for deployment** (webhook callback):
```bash
# Monitor logs
tail -f /var/log/skybot-inbox.log | grep "agent-status"
```

Expected:
```
[SkybotWebhooksController] Agent status changed: INACTIVE
```

4. **Verify agent created**:
```bash
curl -X GET http://localhost:3001/api/agents \
  -H "Authorization: Bearer $TOKEN"
```

**Success Criteria**:
- ✅ Agent status changes from `DEPLOYING` → `INACTIVE`
- ✅ `n8nWorkflowId` is populated
- ✅ `deployedAt` timestamp is set
- ✅ No `errorMessage` in agent record

---

### Test 3: Agent Activation & Execution

**Objective**: Activate agent and verify it processes messages

**Steps**:

1. **Activate agent**:
```bash
curl -X PUT http://localhost:3001/api/agents/{agentId}/activate \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "id": "cm4xyz...",
  "status": "ACTIVE",
  "n8nWorkflowId": "workflow-123"
}
```

2. **Send test message** that triggers this agent

3. **Check execution logs**:
```bash
curl -X GET "http://localhost:3001/api/agents/{agentId}/logs?limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "items": [{
    "id": "log-123",
    "executionStatus": "SUCCESS",
    "inputMessage": "...",
    "outputMessage": "...",
    "processingTimeMs": 1234,
    "openaiTokensUsed": 150,
    "timestamp": "2026-01-29T..."
  }],
  "total": 1
}
```

4. **Check agent stats**:
```bash
curl -X GET "http://localhost:3001/api/agents/{agentId}/stats" \
  -H "Authorization: Bearer $TOKEN"
```

Expected response:
```json
{
  "executions": {
    "total": 1,
    "successful": 1,
    "failed": 0,
    "successRate": 100
  },
  "performance": {
    "avgProcessingTimeMs": 1234,
    "p50ProcessingTimeMs": 1234,
    "p95ProcessingTimeMs": 1234
  },
  "costs": {
    "totalTokensUsed": 150,
    "totalCostUsd": 0.002,
    "avgCostPerExecution": 0.002
  }
}
```

**Success Criteria**:
- ✅ Agent activates without errors
- ✅ Message triggers agent execution
- ✅ AgentLog created with SUCCESS
- ✅ Metrics updated correctly
- ✅ Costs tracked accurately

---

### Test 4: Error Handling

**Objective**: Verify system handles N8N failures gracefully

**Test Cases**:

#### 4a. N8N Unavailable

1. **Stop N8N instance** (temporarily)
2. **Send WhatsApp message**
3. **Expected behavior**:
   - RoutingLog created with status `ERROR`
   - Error message: "N8N unreachable" or similar
   - Message still stored in database
   - No crash or data loss

#### 4b. Invalid Agent Configuration

1. **Deploy agent with invalid templatePath**:
```bash
curl -X POST http://localhost:3001/api/agents \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "templatePath": "templates/invalid/nonexistent.json",
    "agentName": "Test Invalid",
    "agentType": "SALES"
  }'
```

2. **Expected response**:
```json
{
  "statusCode": 400,
  "message": "Template not found: templates/invalid/nonexistent.json"
}
```

#### 4c. N8N Timeout

1. **Configure N8N workflow** to sleep for 130 seconds (> timeout)
2. **Send message**
3. **Expected behavior**:
   - AgentLog created with status `TIMEOUT`
   - Agent errorCount incremented
   - User receives timeout message

**Success Criteria**:
- ✅ All errors logged properly
- ✅ No data loss
- ✅ Graceful degradation
- ✅ User receives fallback response

---

### Test 5: Performance Testing

**Objective**: Verify system handles high message volume

**Tools**: Apache Bench or k6

**Test Script** (k6):
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },  // Ramp up to 10 RPS
    { duration: '5m', target: 10 },  // Stay at 10 RPS
    { duration: '1m', target: 0 },   // Ramp down
  ],
};

export default function () {
  const payload = JSON.stringify({
    entry: [{
      changes: [{
        value: {
          messages: [{
            from: '+506' + Math.floor(Math.random() * 100000000),
            text: { body: 'Test message ' + __ITER },
            timestamp: Date.now() / 1000,
          }],
        },
      }],
    }],
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'x-hub-signature-256': 'sha256=...', // Calculate HMAC
    },
  };

  const res = http.post('http://localhost:3001/webhooks/whatsapp', payload, params);

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

**Metrics to Track**:
- Request throughput (RPS)
- Response time (p50, p95, p99)
- Error rate
- Database connection pool usage
- N8N queue depth

**Success Criteria**:
- ✅ 10 RPS sustained without errors
- ✅ p95 response time < 2 seconds
- ✅ Error rate < 1%
- ✅ No database deadlocks
- ✅ No memory leaks

---

## Troubleshooting

### Issue 1: Messages Not Reaching N8N

**Symptoms**:
- Messages stored in database
- No RoutingLog entries
- No N8N execution

**Diagnosis**:
```bash
# Check if N8N URL is set
echo $N8N_MASTER_ROUTER_URL

# Test N8N connectivity
curl -X POST $N8N_MASTER_ROUTER_URL \
  -H "x-webhook-secret: $N8N_MASTER_ROUTER_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Check database for routing logs
psql $DATABASE_URL -c "SELECT * FROM \"RoutingLog\" ORDER BY \"createdAt\" DESC LIMIT 10;"
```

**Solutions**:
1. Verify `N8N_MASTER_ROUTER_URL` is set correctly
2. Check N8N webhook is active
3. Verify `N8N_MASTER_ROUTER_SECRET` matches N8N configuration
4. Check firewall rules allow outbound HTTPS
5. Review logs for connection errors

---

### Issue 2: N8N Executions Timing Out

**Symptoms**:
- AgentLog entries with status `TIMEOUT`
- High `processingTimeMs` values

**Diagnosis**:
```sql
-- Find slow executions
SELECT
  "agentId",
  "executionStatus",
  "processingTimeMs",
  timestamp
FROM "AgentLog"
WHERE "processingTimeMs" > 30000
ORDER BY timestamp DESC
LIMIT 20;
```

**Solutions**:
1. **Increase timeout** in `agents.service.ts`:
```typescript
// Currently: 120 seconds
const timeout = 180000; // Increase to 180 seconds
```

2. **Optimize N8N workflow**:
   - Reduce API calls
   - Cache frequently used data
   - Use async operations

3. **Check N8N resources**:
   - CPU usage
   - Memory usage
   - Network latency

---

### Issue 3: Agent Deployment Fails

**Symptoms**:
- Agent status stuck in `DEPLOYING`
- `errorMessage` populated

**Diagnosis**:
```bash
# Check SkyBot API connectivity
curl -X GET $SKYBOT_API_URL/health \
  -H "x-api-key: $SKYBOT_API_KEY"

# Check agent status
curl -X GET http://localhost:3001/api/agents/{agentId} \
  -H "Authorization: Bearer $TOKEN"
```

**Solutions**:
1. **Verify SkyBot API credentials**:
   - Check `SKYBOT_API_KEY` is valid
   - Verify `SKYBOT_API_URL` is accessible

2. **Check template path**:
   - Ensure template file exists
   - Verify JSON syntax is valid

3. **Retry deployment**:
```bash
curl -X PUT http://localhost:3001/api/agents/{agentId}/deploy-to-skybot \
  -H "Authorization: Bearer $TOKEN"
```

---

### Issue 4: Webhook Callbacks Not Received

**Symptoms**:
- N8N executes successfully
- No AgentLog entries created
- Agent metrics not updated

**Diagnosis**:
```bash
# Check if webhook endpoint is accessible from N8N
curl -X POST http://localhost:3001/api/webhooks/skybot/health \
  -H "x-skybot-secret: $SKYBOT_WEBHOOK_SECRET"

# Check webhook logs
tail -f /var/log/skybot-inbox.log | grep "skybot/agent-execution"
```

**Solutions**:
1. **Verify webhook secret**:
   - N8N must send `x-skybot-secret` header
   - Value must match `SKYBOT_WEBHOOK_SECRET`

2. **Check firewall**:
   - Ensure N8N can reach SkyBot Inbox (inbound port 3001)

3. **Update N8N webhook URL**:
   - Should point to public URL, not localhost
   - Example: `https://skybot-inbox.onrender.com/api/webhooks/skybot/agent-execution`

---

## API Reference

### Agent Management Endpoints

#### Create Agent
```http
POST /api/agents
Authorization: Bearer {token}
Content-Type: application/json

{
  "templatePath": "templates/sales/lead-scorer.json",
  "agentName": "Lead Scorer",
  "agentType": "SALES",
  "configJson": {
    "threshold": 7,
    "notifyOnHighScore": true
  }
}
```

**Response**: Agent object with status `DEPLOYING`

---

#### List Agents
```http
GET /api/agents
Authorization: Bearer {token}
```

**Response**:
```json
{
  "items": [
    {
      "id": "cm4xyz...",
      "agentName": "Lead Scorer",
      "status": "ACTIVE",
      "agentType": "SALES",
      "executionCount": 42,
      "errorCount": 1
    }
  ],
  "total": 1
}
```

---

#### Activate Agent
```http
PUT /api/agents/{agentId}/activate
Authorization: Bearer {token}
```

**Response**: Agent object with status `ACTIVE`

---

#### Deactivate Agent
```http
PUT /api/agents/{agentId}/deactivate
Authorization: Bearer {token}
```

**Response**: Agent object with status `INACTIVE`

---

#### Get Agent Stats
```http
GET /api/agents/{agentId}/stats
Authorization: Bearer {token}
```

**Response**:
```json
{
  "executions": {
    "total": 100,
    "successful": 95,
    "failed": 5,
    "successRate": 95
  },
  "performance": {
    "avgProcessingTimeMs": 1234,
    "p50ProcessingTimeMs": 1100,
    "p95ProcessingTimeMs": 2500
  },
  "costs": {
    "totalTokensUsed": 15000,
    "totalCostUsd": 2.50,
    "avgCostPerExecution": 0.025
  }
}
```

---

### Webhook Endpoints

#### Agent Execution Callback
```http
POST /api/webhooks/skybot/agent-execution
x-skybot-secret: {SKYBOT_WEBHOOK_SECRET}
Content-Type: application/json

{
  "agentId": "agent-cuid",
  "executionStatus": "SUCCESS|ERROR|TIMEOUT|CANCELLED",
  "inputMessage": "User message",
  "outputMessage": "AI response",
  "processingTimeMs": 1234,
  "openaiTokensUsed": 150,
  "openaiCostUsd": 0.002,
  "errorMessage": "Optional error message"
}
```

**Response**: `{ ok: true }`

---

#### Agent Status Update
```http
POST /api/webhooks/skybot/agent-status
x-skybot-secret: {SKYBOT_WEBHOOK_SECRET}
Content-Type: application/json

{
  "agentId": "agent-cuid",
  "status": "ACTIVE|INACTIVE|ERROR",
  "message": "Optional status message"
}
```

**Response**: `{ ok: true }`

---

## Summary

This document covers the complete N8N integration in SkyBot Inbox. For additional help:

- **Architecture Questions**: See `docs/architecture/`
- **API Documentation**: See `docs/api/`
- **Deployment Issues**: See `docs/deployment/`
- **General Troubleshooting**: See `docs/troubleshooting/`

Last updated: 2026-01-29
