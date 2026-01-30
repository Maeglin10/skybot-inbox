# REST API Documentation

Complete reference for SkyBot Inbox REST API endpoints.

---

## Base URL

```
Development: http://localhost:3001
Production:  https://skybot-inbox.onrender.com
```

---

## Authentication

All API endpoints (except public webhooks and auth endpoints) require authentication via JWT.

### Headers

```http
Authorization: Bearer {access_token}
Content-Type: application/json
```

### Getting an Access Token

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "user_123",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "ADMIN",
    "accountId": "acc_123"
  }
}
```

---

## Authentication Endpoints

### Register New Account

```http
POST /api/auth/register
```

**Body**:
```json
{
  "email": "admin@company.com",
  "password": "SecurePass123!",
  "name": "Admin User",
  "accountName": "My Company"
}
```

**Response**: `201 Created`
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "user": { ... }
}
```

### Login

```http
POST /api/auth/login
```

**Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

### Refresh Token

```http
POST /api/auth/refresh
```

**Body**:
```json
{
  "refreshToken": "eyJhbGc..."
}
```

### Get Current User

```http
GET /api/auth/me
Authorization: Bearer {token}
```

---

## Account Management

### List Accounts (Admin Only)

```http
GET /api/accounts
Authorization: Bearer {token}
```

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20)
- `search`: Search by name

**Response**:
```json
{
  "data": [
    {
      "id": "acc_123",
      "name": "Company Inc",
      "isDemo": false,
      "features": {
        "inbox": true,
        "crm": true,
        "analytics": true
      },
      "createdAt": "2026-01-15T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

### Get Account Details

```http
GET /api/accounts/:id
```

### Update Account

```http
PATCH /api/accounts/:id
```

**Body**:
```json
{
  "name": "New Company Name",
  "features": {
    "inbox": true,
    "crm": false
  }
}
```

---

## Conversations

### List Conversations

```http
GET /api/conversations
```

**Query Parameters**:
- `status`: Filter by status (`OPEN`, `CLOSED`, `PENDING`)
- `inboxId`: Filter by inbox
- `page`, `limit`: Pagination

**Response**:
```json
{
  "data": [
    {
      "id": "conv_123",
      "status": "OPEN",
      "contact": {
        "id": "contact_456",
        "name": "John Doe",
        "phone": "+1234567890"
      },
      "lastMessage": {
        "id": "msg_789",
        "text": "Hello!",
        "direction": "INBOUND",
        "createdAt": "2026-01-30T12:00:00Z"
      },
      "unreadCount": 3,
      "createdAt": "2026-01-30T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "total": 42
  }
}
```

### Get Conversation Details

```http
GET /api/conversations/:id
```

### Update Conversation Status

```http
PATCH /api/conversations/:id/status
```

**Body**:
```json
{
  "status": "CLOSED"
}
```

---

## Messages

### List Messages

```http
GET /api/conversations/:conversationId/messages
```

**Query Parameters**:
- `limit`: Max messages (default: 50)
- `before`: Cursor for pagination

**Response**:
```json
{
  "data": [
    {
      "id": "msg_123",
      "conversationId": "conv_456",
      "direction": "INBOUND",
      "text": "Hello, I need help",
      "attachments": [
        {
          "type": "image",
          "url": "https://...",
          "mimeType": "image/jpeg"
        }
      ],
      "createdAt": "2026-01-30T12:00:00Z",
      "read": false
    }
  ],
  "hasMore": true,
  "nextCursor": "msg_100"
}
```

### Send Message

```http
POST /api/messages
```

**Body**:
```json
{
  "conversationId": "conv_123",
  "text": "Thanks for contacting us!",
  "attachments": [
    {
      "type": "image",
      "url": "https://example.com/image.jpg"
    }
  ]
}
```

**Response**: `201 Created`
```json
{
  "id": "msg_789",
  "externalId": "wamid.xxx",
  "status": "sent",
  "createdAt": "2026-01-30T12:05:00Z"
}
```

---

## Channels

### List Channel Connections

```http
GET /api/channels
```

**Response**:
```json
{
  "data": [
    {
      "id": "conn_123",
      "channelType": "INSTAGRAM",
      "channelIdentifier": "instagram_page_id",
      "status": "ACTIVE",
      "metadata": {
        "pageName": "My Business",
        "username": "@mybusiness"
      },
      "lastSync": "2026-01-30T12:00:00Z"
    }
  ]
}
```

### Start OAuth Connection

```http
POST /api/channels/:channelType/connect
```

**Parameters**:
- `channelType`: `meta`, `whatsapp`, `email`, `webchat`

**Body** (optional):
```json
{
  "returnUrl": "/settings/channels"
}
```

**Response**:
```json
{
  "authUrl": "https://facebook.com/v21.0/dialog/oauth?...",
  "state": "encrypted_state_token"
}
```

**Next Steps**: Redirect user to `authUrl`. After authorization, Meta redirects to callback URL.

### Get Connection Status

```http
GET /api/channels/:connectionId/status
```

**Response**:
```json
{
  "status": "ACTIVE",
  "health": "ok",
  "lastSync": "2026-01-30T12:00:00Z",
  "lastError": null,
  "expiresAt": "2026-03-30T12:00:00Z"
}
```

### Disconnect Channel

```http
DELETE /api/channels/:connectionId
```

---

## CRM

### List Leads

```http
GET /api/crm/leads
```

**Query Parameters**:
- `status`: `NEW`, `CONTACTED`, `QUALIFIED`, `WON`, `LOST`
- `temperature`: `HOT`, `WARM`, `COLD`
- `source`: Lead source
- `page`, `limit`: Pagination

**Response**:
```json
{
  "data": [
    {
      "id": "lead_123",
      "contactId": "contact_456",
      "status": "QUALIFIED",
      "temperature": "HOT",
      "source": "WhatsApp",
      "notes": "Interested in premium plan",
      "estimatedValue": 5000,
      "createdAt": "2026-01-30T10:00:00Z"
    }
  ],
  "meta": {
    "page": 1,
    "total": 15
  }
}
```

### Create Lead

```http
POST /api/crm/leads
```

**Body**:
```json
{
  "contactId": "contact_123",
  "status": "NEW",
  "temperature": "WARM",
  "source": "Website",
  "notes": "Requested demo",
  "estimatedValue": 3000
}
```

### Update Lead

```http
PATCH /api/crm/leads/:id
```

### List Feedbacks

```http
GET /api/crm/feedbacks
```

**Query Parameters**:
- `type`: `POSITIVE`, `NEGATIVE`, `NEUTRAL`, `SUGGESTION`
- `category`: Feedback category
- `page`, `limit`: Pagination

---

## Analytics

### Get Dashboard KPIs

```http
GET /api/analytics/kpis
```

**Query Parameters**:
- `startDate`: ISO date (default: 30 days ago)
- `endDate`: ISO date (default: now)
- `accountId`: Filter by account (admin only)

**Response**:
```json
{
  "conversations": {
    "total": 156,
    "open": 42,
    "closed": 114,
    "avgResponseTime": 120
  },
  "messages": {
    "total": 892,
    "inbound": 456,
    "outbound": 436
  },
  "leads": {
    "total": 34,
    "hot": 12,
    "warm": 18,
    "cold": 4
  },
  "satisfaction": {
    "positive": 28,
    "neutral": 4,
    "negative": 2,
    "score": 4.3
  }
}
```

### Get Chart Data

```http
GET /api/analytics/chart
```

**Query Parameters**:
- `metric`: `conversations`, `messages`, `leads`, `response_time`
- `granularity`: `hour`, `day`, `week`, `month`
- `startDate`, `endDate`: Date range

**Response**:
```json
{
  "metric": "conversations",
  "granularity": "day",
  "data": [
    {
      "timestamp": "2026-01-25T00:00:00Z",
      "value": 12
    },
    {
      "timestamp": "2026-01-26T00:00:00Z",
      "value": 15
    }
  ]
}
```

### Get Breakdown

```http
GET /api/analytics/breakdown
```

**Query Parameters**:
- `dimension`: `channel`, `agent`, `status`, `source`
- `metric`: What to measure
- `startDate`, `endDate`: Date range

---

## Agents (N8N Workflows)

### List Deployed Agents

```http
GET /api/agents
```

**Response**:
```json
{
  "data": [
    {
      "id": "agent_123",
      "name": "Lead Qualification Bot",
      "status": "ACTIVE",
      "category": "sales",
      "triggers": 145,
      "lastTriggeredAt": "2026-01-30T11:00:00Z"
    }
  ]
}
```

### Deploy Agent from Template

```http
POST /api/agents
```

**Body**:
```json
{
  "templateId": "template_lead_qualification",
  "name": "My Lead Bot",
  "configuration": {
    "threshold": 50,
    "language": "en"
  }
}
```

### Activate Agent

```http
PATCH /api/agents/:id/activate
```

### Trigger Agent Manually

```http
POST /api/agents/:id/trigger
```

**Body**:
```json
{
  "conversationId": "conv_123",
  "data": {
    "custom": "payload"
  }
}
```

---

## Alerts

### List Alerts

```http
GET /api/alerts
```

**Query Parameters**:
- `type`: `TRANSACTION`, `CONVERSATION`, `CORPORATE_CONTACT`, `SYSTEM`
- `status`: `UNREAD`, `READ`, `RESOLVED`
- `priority`: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

**Response**:
```json
{
  "data": [
    {
      "id": "alert_123",
      "type": "CORPORATE_CONTACT",
      "priority": "HIGH",
      "title": "VIP Contact Message",
      "message": "John Doe (VIP) sent a new message",
      "status": "UNREAD",
      "conversationId": "conv_456",
      "createdAt": "2026-01-30T12:00:00Z"
    }
  ]
}
```

### Mark Alert as Read

```http
PATCH /api/alerts/:id
```

**Body**:
```json
{
  "status": "READ"
}
```

---

## Billing

### Get Billing Portal URL

```http
GET /api/billing/portal
```

**Response**:
```json
{
  "url": "https://billing.skybot.com?token=eyJhbGc..."
}
```

**Note**: URL includes 5-minute SSO token. Redirect user immediately.

---

## Error Responses

### Error Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "must be a valid email"
    }
  ]
}
```

### Common Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Success |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

- **Default**: 100 requests/minute per IP
- **Authenticated**: 1000 requests/minute per user
- **Webhooks**: 10,000 requests/minute

**Headers**:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1706616000
```

---

## Pagination

All list endpoints support cursor-based pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Results per page (default: 20, max: 100)

**Response**:
```json
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "totalPages": 8
  }
}
```

---

## Filtering & Sorting

**Query Parameters**:
- `filter[field]=value`: Filter by field
- `sort=field`: Sort ascending
- `sort=-field`: Sort descending

**Example**:
```
GET /api/conversations?filter[status]=OPEN&sort=-createdAt
```

---

**For webhook documentation, see [WEBHOOKS.md](./WEBHOOKS.md)**

**Last Updated**: 2026-01-30
