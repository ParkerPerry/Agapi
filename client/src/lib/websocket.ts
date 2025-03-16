
import { getUser } from '@/hooks/use-auth';

// WebSocket connection
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECT_ATTEMPTS = 5;

// Map to store message type listeners
const LISTENERS = new Map<string, Set<(data: any) => void>>();

// Clear WebSocket state when connection fails
function clearWebSocketState() {
  ws = null;
  reconnectAttempts = 0;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

// Create a new WebSocket connection
export function createWebSocket(): WebSocket {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return ws;
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);

  socket.onopen = () => {
    console.log('WebSocket connection established');
    reconnectAttempts = 0;

    // Set up ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: 'ping' }));
        } catch (error) {
          console.error('Error sending ping:', error);
          clearInterval(pingInterval);
        }
      } else {
        clearInterval(pingInterval);
      }
    }, 25000); // Send ping every 25 seconds

    // Clean up interval when socket closes
    socket.addEventListener('close', () => clearInterval(pingInterval));
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Handle server pings
      if (data.type === 'pong' || data.type === 'server-ping') {
        return;
      }

      // Handle unauthorized responses
      if (data.type === 'error' && data.code === 401) {
        console.log('WebSocket received unauthorized error, closing connection');
        socket.close(1000, 'Unauthorized');
        clearWebSocketState();
        return;
      }

      // Notify all listeners for this message type
      const listeners = LISTENERS.get(data.type) || new Set();
      listeners.forEach(callback => callback(data));

      // Also notify general subscribers
      const allListeners = LISTENERS.get('*') || new Set();
      allListeners.forEach(callback => callback(data));

    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  socket.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);

    // Don't reconnect if closed due to auth issues or clean closure
    if (event.code === 1000 || event.code === 1001 || event.code === 1008) {
      clearWebSocketState();
      return;
    }

    // Try to reconnect with exponential backoff
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnectAttempts++;
      console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempts})...`);

      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }

      const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
      reconnectTimeout = setTimeout(() => createWebSocket(), timeout);
    } else {
      console.log('Maximum reconnection attempts reached');
      clearWebSocketState();
    }
  };

  socket.onerror = (error) => {
    console.error('WebSocket error:', error);
  };

  ws = socket;
  return socket;
}

export function subscribeToWebSocket(type: string, callback: (data: any) => void): () => void {
  if (!LISTENERS.has(type)) {
    LISTENERS.set(type, new Set());
  }

  const listeners = LISTENERS.get(type)!;
  listeners.add(callback);

  // Return unsubscribe function
  return () => {
    const set = LISTENERS.get(type);
    if (set) {
      set.delete(callback);
      if (set.size === 0) {
        LISTENERS.delete(type);
      }
    }
  };
}

export function sendWebSocketMessage(message: any): void {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    const user = getUser();
    if (!user) {
      console.warn('Cannot send message: Not authenticated');
      return;
    }
    
    ws = createWebSocket();
    // Queue the message to be sent when the connection is established
    ws.addEventListener('open', () => {
      sendWebSocketMessage(message);
    });
    return;
  }

  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
  }
}

// Initialize WebSocket on user authentication
export function initializeWebSocket(): void {
  const user = getUser();
  if (user && (!ws || ws.readyState !== WebSocket.OPEN)) {
    createWebSocket();
  }
}

// Close WebSocket connection
export function closeWebSocket(): void {
  if (ws) {
    ws.close(1000, 'User logout');
    clearWebSocketState();
  }
}
