import { useAuth } from "@/hooks/use-auth";

// WebSocket connection
let ws: WebSocket | null = null;
let reconnectAttempts = 0;
let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
const MAX_RECONNECT_ATTEMPTS = 5;

// Map to store message type listeners
const LISTENERS = new Map<string, Set<(data: any) => void>>();

function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const port = window.location.port || '5000';
  const wsUrl = `${protocol}//${hostname}:${port}/ws`;
  console.log('Constructing WebSocket URL:', {
    protocol,
    hostname,
    port,
    finalUrl: wsUrl
  });
  return wsUrl;
}

export function createWebSocket(): WebSocket | null {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log('WebSocket connection already exists');
    return ws;
  }

  try {
    const socket = new WebSocket(getWebSocketUrl());
    console.log('Creating new WebSocket connection');

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
            socket.close();
          }
        } else {
          clearInterval(pingInterval);
        }
      }, 30000); // Send ping every 30 seconds

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
        console.error('Error processing WebSocket message:', error);
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
  } catch (error) {
    console.error('Error creating WebSocket:', error);
    return null;
  }
}

function clearWebSocketState() {
  if (ws) {
    try {
      ws.close();
    } catch (error) {
      console.error('Error closing WebSocket:', error);
    }
  }
  ws = null;
  reconnectAttempts = 0;
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
}

export function subscribeToWebSocket(type: string, callback: (data: any) => void): () => void {
  if (!LISTENERS.has(type)) {
    LISTENERS.set(type, new Set());
  }

  const listeners = LISTENERS.get(type)!;
  listeners.add(callback);

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
    console.warn('WebSocket not connected, message dropped:', message);
    return;
  }

  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    ws.close();
  }
}

export function closeWebSocket(): void {
  clearWebSocketState();
}