/**
 * WebSocket Client Configuration
 * Manages Socket.IO connection to the backend
 */
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

/**
 * Get or create WebSocket connection
 */
export const getSocket = (token?: string): Socket => {
  if (socket && socket.connected) {
    return socket;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const wsUrl = `${apiUrl}/events`;

  socket = io(wsUrl, {
    auth: {
      token: token,
    },
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  return socket;
};

/**
 * Connect to WebSocket server
 */
export const connectSocket = (token: string): Socket => {
  const sock = getSocket(token);

  if (!sock.connected) {
    // Update token in auth if it changed
    sock.auth = { token };
    sock.connect();
  }

  return sock;
};

/**
 * Disconnect from WebSocket server
 */
export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

/**
 * Check if socket is connected
 */
export const isSocketConnected = (): boolean => {
  return socket?.connected ?? false;
};
