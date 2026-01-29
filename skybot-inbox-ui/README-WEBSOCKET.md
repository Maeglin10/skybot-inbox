# WebSocket Integration Guide

## 📡 Real-Time Features

The backend WebSocket server is fully implemented with:
- ✅ Real-time message delivery
- ✅ Read receipts (Slack/WhatsApp style)
- ✅ Typing indicators
- ✅ Presence tracking (online/offline/away/busy)
- ✅ Automatic reconnection
- ✅ JWT authentication
- ✅ Room-based subscriptions

## 🚀 Quick Start

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Use the WebSocket Hook

The `useWebSocket` hook is already implemented at:
- **File**: `src/hooks/use-websocket.ts`

```typescript
import { useWebSocket } from '@/hooks/use-websocket';

function MyConversation({ conversationId, accessToken }) {
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    markAsRead,
    sendTyping,
  } = useWebSocket({
    accessToken,
    onMessage: (message) => {
      console.log('New message:', message);
      // Update your messages state
    },
    onPresenceUpdate: (presence) => {
      console.log('User presence:', presence);
      // Update online status indicators
    },
    onTyping: (typing) => {
      console.log('User typing:', typing);
      // Show typing indicator
    },
  });

  // Join conversation when component mounts
  useEffect(() => {
    if (isConnected) {
      joinConversation(conversationId);
    }
    return () => leaveConversation(conversationId);
  }, [isConnected, conversationId]);

  return <div>...</div>;
}
```

### 3. Example Implementation

A full example is available at:
- **File**: `src/components/conversations/WebSocketExample.tsx`

This shows:
- Connection status indicator
- Real-time message updates
- Typing indicators with animation
- Auto-marking messages as read

## 🔌 Backend API

### Events You Can Listen To

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `{ id, conversationId, text, timestamp, direction }` | New message received |
| `presence:update` | `{ userId, status, lastSeenAt }` | User online status changed |
| `message:read` | `{ conversationId, messageId, userId, readAt }` | Message marked as read |
| `typing` | `{ conversationId, userId, isTyping }` | User typing indicator |

### Events You Can Emit

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token }` | Authenticate with JWT token |
| `join_conversation` | `{ conversationId }` | Subscribe to conversation updates |
| `leave_conversation` | `{ conversationId }` | Unsubscribe from conversation |
| `mark_read` | `{ conversationId, messageId }` | Mark message as read |
| `typing` | `{ conversationId, isTyping }` | Send typing indicator |
| `presence:update_status` | `{ status }` | Update your status (online/away/busy) |
| `heartbeat` | `{}` | Keep connection alive (sent every 30s) |

## 🎨 UI Integration Examples

### 1. Online Status Indicator

```tsx
function OnlineIndicator({ userId }) {
  const [isOnline, setIsOnline] = useState(false);

  useWebSocket({
    onPresenceUpdate: (presence) => {
      if (presence.userId === userId) {
        setIsOnline(presence.status === 'online');
      }
    },
  });

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        isOnline ? 'bg-green-500' : 'bg-gray-300'
      }`} />
      <span>{isOnline ? 'Online' : 'Offline'}</span>
    </div>
  );
}
```

### 2. Typing Indicator

```tsx
function TypingIndicator({ conversationId }) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

  useWebSocket({
    onTyping: (typing) => {
      if (typing.conversationId === conversationId) {
        setTypingUsers(prev => {
          const updated = new Set(prev);
          if (typing.isTyping) {
            updated.add(typing.userId);
          } else {
            updated.delete(typing.userId);
          }
          return updated;
        });
      }
    },
  });

  if (typingUsers.size === 0) return null;

  return (
    <div className="flex gap-1 px-4 py-2">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
    </div>
  );
}
```

### 3. Auto-Mark as Read

```tsx
function MessageList({ conversationId, messages }) {
  const { markAsRead } = useWebSocket({
    onMessage: (message) => {
      // Auto-mark incoming messages as read
      if (message.direction === 'IN') {
        markAsRead(conversationId, message.id);
      }
    },
  });

  return (
    <div>
      {messages.map(msg => <Message key={msg.id} {...msg} />)}
    </div>
  );
}
```

### 4. Send Typing Indicator

```tsx
function MessageComposer({ conversationId }) {
  const { sendTyping } = useWebSocket({});
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleInput = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(conversationId, true);
    }

    // Clear existing timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeout.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(conversationId, false);
    }, 2000);
  };

  return (
    <textarea
      placeholder="Type a message..."
      onChange={handleInput}
    />
  );
}
```

## 🔒 Security

- ✅ **JWT Authentication Required**: All WebSocket connections must authenticate with a valid JWT token
- ✅ **Room-Based Access Control**: Users can only join conversations they have access to
- ✅ **Multi-Tenant Isolation**: All events are scoped to the user's account
- ✅ **Automatic Token Refresh**: Handle token expiration with reconnection

## 🐛 Debugging

### Enable WebSocket Logs

In your browser console:
```javascript
localStorage.debug = 'socket.io-client:*';
```

### Connection Issues

1. **Check NEXT_PUBLIC_WEBSOCKET_URL** in `.env.local`:
   ```
   NEXT_PUBLIC_WEBSOCKET_URL=http://localhost:3001
   ```

2. **Verify backend is running**:
   ```bash
   curl http://localhost:3001/health
   ```

3. **Check JWT token validity**:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3001/api/auth/me
   ```

### Common Errors

| Error | Solution |
|-------|----------|
| `"Not authenticated"` | Ensure you're passing a valid JWT token to `useWebSocket` |
| `"Failed to connect"` | Check that backend is running and WEBSOCKET_URL is correct |
| `"Token expired"` | Implement token refresh logic or reconnect with new token |

## 📊 Performance Tips

1. **Debounce typing indicators** to avoid excessive events
2. **Use heartbeat** to keep connection alive (already implemented)
3. **Cleanup on unmount** to prevent memory leaks (already handled)
4. **Batch message updates** to reduce re-renders

## 🚦 Production Checklist

- [ ] Set `NEXT_PUBLIC_WEBSOCKET_URL` to production URL
- [ ] Enable CORS for production domain in backend
- [ ] Use WSS (secure WebSocket) in production
- [ ] Monitor WebSocket connection metrics
- [ ] Implement reconnection backoff strategy (already done)
- [ ] Add Sentry/logging for WebSocket errors

## 📚 Learn More

- [Socket.IO Client Docs](https://socket.io/docs/v4/client-api/)
- [Backend WebSocket Implementation](../src/websockets/messages.gateway.ts)
- [Presence Service](../src/websockets/presence.service.ts)
- [Read Receipts Service](../src/conversations/conversation-participant.service.ts)
