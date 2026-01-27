
import { io, Socket } from 'socket.io-client';

class AgentsSocket {
  private socket: Socket | null = null;

  connect(token: string) {
    this.socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  subscribeToAgent(agentId: string) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.emit('subscribe:agent', agentId);
  }

  onAgentStatusChange(callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.on('agent:status', callback);
  }

  onAgentExecution(callback: (data: any) => void) {
    if (!this.socket) {
      console.warn('Socket not connected');
      return;
    }
    this.socket.on('agent:execution', callback);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const agentsSocket = new AgentsSocket();
