'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface WebSocketMessage {
  id: string;
  conversationId: string;
  text: string;
  timestamp: Date;
  direction: 'IN' | 'OUT';
  from?: string;
  to?: string;
}

export interface PresenceUpdate {
  userId: string;
  status: 'online' | 'offline' | 'away' | 'busy';
  lastSeenAt: Date;
}

export interface ReadReceipt {
  conversationId: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface UseWebSocketOptions {
  accessToken: string | null;
  onMessage?: (message: WebSocketMessage) => void;
  onPresenceUpdate?: (presence: PresenceUpdate) => void;
  onReadReceipt?: (receipt: ReadReceipt) => void;
  onTyping?: (typing: TypingIndicator) => void;
  onError?: (error: Error) => void;
}

export function useWebSocket({
  accessToken,
  onMessage,
  onPresenceUpdate,
  onReadReceipt,
  onTyping,
  onError,
}: UseWebSocketOptions) {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const heartbeatInterval = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  useEffect(() => {
    if (!accessToken) {
      return;
    }

    const WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3001';

    const socket = io(WEBSOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection handlers
    socket.on('connect', () => {
      console.log('[WebSocket] Connected');

      // Authenticate
      socket.emit('authenticate', { token: accessToken });
    });

    socket.on('authenticated', () => {
      console.log('[WebSocket] Authenticated');
      setIsConnected(true);

      // Start heartbeat (every 30 seconds)
      heartbeatInterval.current = setInterval(() => {
        socket.emit('heartbeat', {});
      }, 30000);
    });

    socket.on('disconnect', () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);

      // Clear heartbeat
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
        heartbeatInterval.current = null;
      }
    });

    // Message events
    socket.on('message:new', (data: WebSocketMessage) => {
      console.log('[WebSocket] New message:', data);
      onMessage?.(data);
    });

    // Presence events
    socket.on('presence:update', (data: PresenceUpdate) => {
      console.log('[WebSocket] Presence update:', data);
      onPresenceUpdate?.(data);
    });

    // Read receipt events
    socket.on('message:read', (data: ReadReceipt) => {
      console.log('[WebSocket] Message read:', data);
      onReadReceipt?.(data);
    });

    // Typing events
    socket.on('typing', (data: TypingIndicator) => {
      console.log('[WebSocket] Typing indicator:', data);
      onTyping?.(data);
    });

    // Error handling
    socket.on('error', (error: { message: string }) => {
      console.error('[WebSocket] Error:', error);
      onError?.(new Error(error.message));
    });

    socket.on('connect_error', (error: Error) => {
      console.error('[WebSocket] Connection error:', error);
      onError?.(error);
    });

    // Cleanup on unmount
    return () => {
      if (heartbeatInterval.current) {
        clearInterval(heartbeatInterval.current);
      }
      socket.disconnect();
    };
  }, [accessToken, onMessage, onPresenceUpdate, onReadReceipt, onTyping, onError]);

  // Join conversation room
  const joinConversation = useCallback((conversationId: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn('[WebSocket] Cannot join conversation: not connected');
      return;
    }

    socketRef.current.emit('join_conversation', { conversationId });
    setCurrentConversationId(conversationId);
  }, [isConnected]);

  // Leave conversation room
  const leaveConversation = useCallback((conversationId: string) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('leave_conversation', { conversationId });
    if (currentConversationId === conversationId) {
      setCurrentConversationId(null);
    }
  }, [isConnected, currentConversationId]);

  // Mark message as read
  const markAsRead = useCallback((conversationId: string, messageId: string) => {
    if (!socketRef.current || !isConnected) {
      console.warn('[WebSocket] Cannot mark as read: not connected');
      return;
    }

    socketRef.current.emit('mark_read', { conversationId, messageId });
  }, [isConnected]);

  // Send typing indicator
  const sendTyping = useCallback((conversationId: string, isTyping: boolean) => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('typing', { conversationId, isTyping });
  }, [isConnected]);

  // Update presence status
  const updateStatus = useCallback((status: 'online' | 'away' | 'busy') => {
    if (!socketRef.current || !isConnected) {
      return;
    }

    socketRef.current.emit('presence:update_status', { status });
  }, [isConnected]);

  return {
    isConnected,
    currentConversationId,
    joinConversation,
    leaveConversation,
    markAsRead,
    sendTyping,
    updateStatus,
  };
}
