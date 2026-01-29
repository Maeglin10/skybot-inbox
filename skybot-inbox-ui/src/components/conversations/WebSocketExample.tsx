'use client';

/**
 * Example component showing how to use WebSocket in conversations
 *
 * This is a reference implementation that demonstrates:
 * - Real-time message updates
 * - Read receipts
 * - Typing indicators
 * - Presence tracking
 *
 * To integrate into your app:
 * 1. Copy the useWebSocket hook usage into your existing ConversationClient
 * 2. Add message handlers to update your message list state
 * 3. Add typing indicator UI
 * 4. Add presence indicators (green dot for online users)
 */

import { useEffect, useState, useCallback } from 'react';
import { useWebSocket, WebSocketMessage, TypingIndicator } from '@/hooks/use-websocket';

interface WebSocketExampleProps {
  conversationId: string;
  accessToken: string;
}

export function WebSocketExample({ conversationId, accessToken }: WebSocketExampleProps) {
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isTyping, setIsTyping] = useState(false);

  // Initialize WebSocket
  const {
    isConnected,
    joinConversation,
    leaveConversation,
    markAsRead,
    sendTyping,
  } = useWebSocket({
    accessToken,

    // Handle new messages
    onMessage: useCallback((message: WebSocketMessage) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message]);

        // Mark as read if incoming message
        if (message.direction === 'IN') {
          markAsRead(conversationId, message.id);
        }
      }
    }, [conversationId, markAsRead]),

    // Handle typing indicators
    onTyping: useCallback((typing: TypingIndicator) => {
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

        // Auto-clear typing indicator after 3 seconds
        setTimeout(() => {
          setTypingUsers(prev => {
            const updated = new Set(prev);
            updated.delete(typing.userId);
            return updated;
          });
        }, 3000);
      }
    }, [conversationId]),

    // Handle errors
    onError: useCallback((error: Error) => {
      console.error('[WebSocket] Error:', error);
    }, []),
  });

  // Join conversation on mount
  useEffect(() => {
    if (isConnected && conversationId) {
      joinConversation(conversationId);
    }

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
    };
  }, [isConnected, conversationId, joinConversation, leaveConversation]);

  // Send typing indicator when user types
  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(conversationId, true);

      // Stop typing after 2 seconds of inactivity
      setTimeout(() => {
        setIsTyping(false);
        sendTyping(conversationId, false);
      }, 2000);
    }
  }, [isTyping, conversationId, sendTyping]);

  return (
    <div className="flex flex-col h-full">
      {/* Connection status */}
      <div className="px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-gray-300'
            }`}
          />
          <span className="text-sm text-muted-foreground">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.direction === 'OUT' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                message.direction === 'OUT'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <p>{message.text}</p>
              <span className="text-xs opacity-70">
                {new Date(message.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Message composer */}
      <div className="border-t p-4">
        <input
          type="text"
          placeholder="Type a message..."
          className="w-full px-4 py-2 border rounded-lg"
          onChange={handleTyping}
        />
      </div>
    </div>
  );
}
