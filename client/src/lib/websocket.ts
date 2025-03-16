// WebSocket singleton implementation
let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 15;
const LISTENERS: Map<string, Set<(data: any) => void>> = new Map();

// Get WebSocket URL based on current window location
function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

function clearWebSocketState() {
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  reconnectAttempts = 0;
  ws = null;
}

export function createWebSocket(): WebSocket | null {
  // Don't create a connection if there's no authentication token
  if (!localStorage.getItem('token')) {
    console.log('No authentication token found, skipping WebSocket connection');
    return null;
  }

  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    console.log('WebSocket connection already exists');
    return ws;
  }

  // Close any existing connection
  if (ws) {
    console.log('Closing existing WebSocket connection');
    ws.close();
  }

  const wsUrl = getWebSocketUrl();
  console.log(`Connecting to WebSocket at ${wsUrl}`);

  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    console.log('WebSocket connection established');
    reconnectAttempts = 0;

    // Start ping interval to keep the connection alive
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
    const token = localStorage.getItem('token');
    if (!token) {
      console.warn('Cannot send message: No authentication token');
      return;
    }

    createWebSocket();
    // Queue message to be sent when connection is established
    setTimeout(() => sendWebSocketMessage(message), 500);
    return;
  }

  try {
    ws.send(JSON.stringify(message));
  } catch (error) {
    console.error('Error sending WebSocket message:', error);
    ws.close();
  }
}