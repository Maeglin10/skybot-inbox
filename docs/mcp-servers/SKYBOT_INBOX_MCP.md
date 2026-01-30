# SkyBot Inbox MCP Server

Model Context Protocol server for real-time monitoring and debugging of SkyBot Inbox.

---

## Overview

The SkyBot Inbox MCP server provides Claude with direct access to production database for:
- Real-time conversation monitoring
- Contact management insights
- Webhook health checks
- Account statistics
- Debugging and troubleshooting

**Location**: `/mcp-server/`

---

## Installation

### 1. Build the Server

```bash
cd mcp-server
npm install
npm run build
```

The compiled server will be in `dist/index.js`.

### 2. Configure Claude Code

Edit `~/.claude/config.json`:

```json
{
  "mcpServers": {
    "skybot-inbox": {
      "command": "node",
      "args": ["/absolute/path/to/skybot-inbox/mcp-server/dist/index.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:password@host:5432/skybot_inbox"
      }
    }
  }
}
```

**IMPORTANT**: Use your actual PostgreSQL connection string. **Never commit this config to git**.

### 3. Restart Claude Code

The MCP server will be loaded automatically.

---

## Available Tools

### 1. `get_conversations`

Retrieve conversations with contact details and last message.

**Parameters**:
- `accountId` (optional): Account ID (default: "GoodLife")
- `limit` (optional): Max conversations (default: 20)
- `status` (optional): Filter by status: `OPEN`, `CLOSED`, `PENDING`

**Example**:
```typescript
// Get open conversations
await get_conversations({
  accountId: "GoodLife",
  status: "OPEN",
  limit: 10
});
```

**Returns**:
```json
[
  {
    "id": "conv_123",
    "status": "OPEN",
    "contact": {
      "name": "John Doe",
      "phone": "+1234567890",
      "isCorporate": false
    },
    "lastMessage": {
      "text": "Hello!",
      "direction": "INBOUND",
      "createdAt": "2026-01-30T12:00:00Z"
    },
    "unreadCount": 3
  }
]
```

---

### 2. `get_corporate_contacts`

Retrieve all corporate (VIP) contacts.

**Parameters**:
- `accountId` (optional): Account ID (default: "GoodLife")

**Example**:
```typescript
await get_corporate_contacts({
  accountId: "GoodLife"
});
```

**Returns**:
```json
[
  {
    "id": "contact_456",
    "name": "VIP Client",
    "phone": "+1234567890",
    "isCorporate": true,
    "metadata": {
      "company": "Big Corp Inc",
      "role": "CEO"
    }
  }
]
```

---

### 3. `get_conversation_messages`

Retrieve all messages from a specific conversation.

**Parameters**:
- `conversationId` (required): Conversation ID
- `limit` (optional): Max messages (default: 50)

**Example**:
```typescript
await get_conversation_messages({
  conversationId": "conv_123",
  limit: 100
});
```

**Returns**:
```json
[
  {
    "id": "msg_789",
    "direction": "INBOUND",
    "text": "I need help with my order",
    "attachments": [],
    "createdAt": "2026-01-30T12:00:00Z",
    "read": false
  }
]
```

---

### 4. `get_inboxes`

Retrieve all inboxes (WhatsApp numbers, IG accounts, etc.) with connection status.

**Parameters**:
- `accountId` (optional): Account ID (default: "GoodLife")

**Example**:
```typescript
await get_inboxes({
  accountId: "GoodLife"
});
```

**Returns**:
```json
[
  {
    "id": "inbox_123",
    "name": "Main WhatsApp",
    "channelType": "WHATSAPP",
    "identifier": "+1234567890",
    "status": "ACTIVE",
    "phoneNumberId": "958241240707717",
    "lastMessageAt": "2026-01-30T12:00:00Z"
  }
]
```

---

### 5. `get_account_stats`

Get comprehensive account statistics.

**Parameters**:
- `accountId` (optional): Account ID (default: "GoodLife")

**Example**:
```typescript
await get_account_stats({
  accountId: "GoodLife"
});
```

**Returns**:
```json
{
  "account": {
    "id": "GoodLife",
    "name": "GoodLife Costa Rica"
  },
  "conversations": {
    "total": 156,
    "open": 42,
    "closed": 114,
    "pending": 0
  },
  "messages": {
    "total": 892,
    "inbound": 456,
    "outbound": 436,
    "last24h": 45
  },
  "contacts": {
    "total": 89,
    "corporate": 16
  },
  "inboxes": {
    "total": 2,
    "active": 2,
    "inactive": 0
  }
}
```

---

### 6. `search_contacts`

Search contacts by name or phone number.

**Parameters**:
- `accountId` (optional): Account ID (default: "GoodLife")
- `query` (required): Search term (min 3 characters)

**Example**:
```typescript
await search_contacts({
  accountId: "GoodLife",
  query: "John"
});
```

**Returns**:
```json
[
  {
    "id": "contact_123",
    "name": "John Doe",
    "phone": "+1234567890",
    "isCorporate": false,
    "conversationCount": 3,
    "lastMessageAt": "2026-01-30T10:00:00Z"
  }
]
```

---

### 7. `check_webhook_health`

Verify webhook configuration and recent message activity.

**Parameters**:
- `accountId` (optional): Account ID (default: "GoodLife")

**Example**:
```typescript
await check_webhook_health({
  accountId: "GoodLife"
});
```

**Returns**:
```json
{
  "status": "healthy",
  "lastMessageReceived": "2026-01-30T12:00:00Z",
  "messagesLast1Hour": 12,
  "messagesLast24Hours": 145,
  "inboxes": [
    {
      "name": "Main WhatsApp",
      "status": "ACTIVE",
      "lastMessage": "2026-01-30T12:00:00Z",
      "messagesLast1Hour": 12
    }
  ],
  "issues": []
}
```

**Possible Issues**:
- `no_recent_messages`: No messages received in 1 hour
- `inbox_inactive`: One or more inboxes are inactive
- `high_error_rate`: Many failed message deliveries

---

## Use Cases

### 1. Debugging Production Issues

**Scenario**: User reports "messages not being received"

```typescript
// Check webhook health
const health = await check_webhook_health({ accountId: "CustomerAccount" });

if (health.issues.includes('no_recent_messages')) {
  // Check inbox status
  const inboxes = await get_inboxes({ accountId: "CustomerAccount" });
  console.log('Inactive inboxes:', inboxes.filter(i => i.status !== 'ACTIVE'));
}
```

---

### 2. Monitoring VIP Contacts

**Scenario**: Ensure corporate contacts are responded to quickly

```typescript
// Get all VIP contacts
const vips = await get_corporate_contacts({ accountId: "GoodLife" });

// Get their recent conversations
for (const vip of vips) {
  const convos = await get_conversations({
    accountId: "GoodLife",
    status: "OPEN"
  });

  const vipConvos = convos.filter(c => c.contact.id === vip.id);

  if (vipConvos.some(c => c.unreadCount > 0)) {
    console.warn(`VIP ${vip.name} has unread messages!`);
  }
}
```

---

### 3. Real-Time Dashboard

**Scenario**: Generate a real-time status report

```typescript
const stats = await get_account_stats({ accountId: "GoodLife" });

console.log(`
📊 Account Status: ${stats.account.name}
- Open Conversations: ${stats.conversations.open}
- Messages Today: ${stats.messages.last24h}
- VIP Contacts: ${stats.contacts.corporate}
- Active Inboxes: ${stats.inboxes.active}
`);
```

---

### 4. Testing After Deployment

**Scenario**: Validate deployment worked correctly

```typescript
// 1. Check account exists
const stats = await get_account_stats({ accountId: "GoodLife" });

// 2. Verify inboxes are active
const inboxes = await get_inboxes({ accountId: "GoodLife" });
const inactive = inboxes.filter(i => i.status !== 'ACTIVE');

if (inactive.length > 0) {
  console.error('Inactive inboxes detected:', inactive);
}

// 3. Check recent webhook activity
const health = await check_webhook_health({ accountId: "GoodLife" });

if (health.messagesLast1Hour === 0) {
  console.warn('No messages received in the last hour');
}

console.log('✅ Deployment validation complete');
```

---

## Development

### Run in Dev Mode

```bash
cd mcp-server
npm run dev
```

### Test Locally

```bash
cd mcp-server
DATABASE_URL="postgresql://user:pass@localhost:5432/skybot_inbox" node dist/index.js
```

The server will start and wait for MCP commands via stdin/stdout.

---

## Security

**Important Security Notes**:

1. **Read-Only Access**: MCP server only performs `SELECT` queries. It cannot modify data.
2. **Database Credentials**: Store `DATABASE_URL` in `~/.claude/config.json`, which is user-specific and not committed to git.
3. **Local Only**: MCP servers run locally on your machine, not in the cloud.
4. **No External Network**: The server only connects to your database, no other external services.

---

## Troubleshooting

### Server Not Loading

**Issue**: MCP server not appearing in Claude Code

**Solution**:
1. Verify `~/.claude/config.json` syntax is valid JSON
2. Check the absolute path to `dist/index.js` is correct
3. Ensure `npm run build` completed successfully
4. Restart Claude Code

---

### Database Connection Error

**Issue**: `Error: Can't reach database server`

**Solution**:
1. Verify `DATABASE_URL` is correct
2. Test connection manually:
   ```bash
   psql "postgresql://user:pass@host:5432/dbname"
   ```
3. Check firewall rules (especially for Render.com databases)
4. Ensure IP is whitelisted (if applicable)

---

### Permission Denied

**Issue**: `Error: permission denied for table`

**Solution**:
The database user needs `SELECT` permissions on all tables:

```sql
GRANT SELECT ON ALL TABLES IN SCHEMA public TO your_user;
```

---

## Architecture

```
┌─────────────────┐
│  Claude Code    │
└────────┬────────┘
         │ MCP Protocol (stdio)
         ▼
┌─────────────────────┐
│  MCP Server         │
│  (Node.js)          │
│                     │
│  - get_conversations│
│  - get_contacts     │
│  - check_health     │
└────────┬────────────┘
         │ SQL (read-only)
         ▼
┌─────────────────────┐
│  PostgreSQL         │
│  (Production DB)    │
└─────────────────────┘
```

---

## Future Enhancements

- [ ] **Write Operations**: Enable message sending via MCP
- [ ] **Alerts**: Real-time alert notifications in Claude
- [ ] **Caching**: Redis cache for faster responses
- [ ] **Analytics**: Time-series queries for trends
- [ ] **Multi-Account**: Switch between accounts dynamically

---

**For Airtable MCP Server, see [AIRTABLE_MCP.md](./AIRTABLE_MCP.md)**

**Last Updated**: 2026-01-30
