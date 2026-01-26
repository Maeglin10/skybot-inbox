'use client';

import { useEffect } from 'react';
import { agentsSocket } from '@/lib/websocket/agents-socket';

export function useAgentsWebSocket() {
  useEffect(() => {
    // In a real app, you might get this from a context or a hook like useAuth
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) return;

    const socket = agentsSocket.connect(token);

    return () => {
      agentsSocket.disconnect();
    };
  }, []);

  return {
    subscribeToAgent: agentsSocket.subscribeToAgent.bind(agentsSocket),
    onAgentStatusChange: agentsSocket.onAgentStatusChange.bind(agentsSocket),
    onAgentExecution: agentsSocket.onAgentExecution.bind(agentsSocket),
  };
}
