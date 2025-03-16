
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

export function createWebSocket() {
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
        socket.send(JSON.stringify({ type: 'ping' }));
      } else {
        clearInterval(pingInterval);
      }
    }, 30000); // Send ping every 30 seconds
  };
  
  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      
      // Handle server pings
      if (data.type === 'pong' || data.type === 'server-ping') {
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
    
    // Try to reconnect unless closure was clean
    if (event.code !== 1000 && event.code !== 1001) {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempts})...`);
        
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
        }
        
        // Exponential backoff for reconnection
        const timeout = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 30000);
        reconnectTimeout = setTimeout(() => createWebSocket(), timeout);
      } else {
        console.log('Maximum reconnection attempts reached');
      }
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
  
  // Make sure WebSocket is initialized
  if (!ws || (ws.readyState !== WebSocket.OPEN && ws.readyState !== WebSocket.CONNECTING)) {
    createWebSocket();
  }
  
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

export function sendWebSocketMessage(message: any) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    createWebSocket();
    // Queue message to be sent when connection is established
    setTimeout(() => sendWebSocketMessage(message), 500);
    return;
  }
  
  ws.send(JSON.stringify(message));
}
