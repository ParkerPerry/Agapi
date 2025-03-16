// WebSocket singleton implementation
let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const LISTENERS: Map<string, Set<(data: any) => void>> = new Map();

// Get WebSocket URL based on current window location
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};

// Create and manage WebSocket connection
export function createWebSocket(): WebSocket | null {
  // Close existing connection if any
  if (ws && ws.readyState !== WebSocket.CLOSED) {
    console.log("Closing existing WebSocket connection");
    ws.close();
  }

  try {
    const wsUrl = getWebSocketUrl();
    console.log(`Connecting to WebSocket at ${wsUrl}`);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection

      // Send initial ping
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Handle server pings
        if (data.type === 'server-ping') {
          ws?.send(JSON.stringify({ type: 'ping' }));
          return;
        }

        // Handle pongs
        if (data.type === 'pong') {
          // Connection is alive, nothing special to do
          return;
        }

        // Notify all listeners for this post ID
        if (data.postId) {
          const postListeners = LISTENERS.get(`post-${data.postId}`);
          if (postListeners) {
            postListeners.forEach(listener => listener(data));
          }
        }

        // Notify global listeners
        const globalListeners = LISTENERS.get('global');
        if (globalListeners) {
          globalListeners.forEach(listener => listener(data));
        }
      } catch (error) {
        console.error("Error processing WebSocket message:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);

      // Only attempt to reconnect if we haven't exceeded the maximum attempts
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        // Attempt to reconnect with exponential backoff
        const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
        console.log(`Will attempt to reconnect WebSocket in ${backoff}ms (attempt ${reconnectAttempts + 1})`);

        reconnectTimeout = setTimeout(() => {
          console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempts + 1})...`);
          reconnectAttempts++;
          createWebSocket();
        }, backoff);
      } else {
        console.log("Maximum reconnection attempts reached, giving up");
      }
    };
  } catch (err) {
    console.error("Error creating WebSocket:", err);
  }

  return ws;
}

// Subscribe to WebSocket updates
export function subscribeToWebSocket(key: string, callback: (data: any) => void): () => void {
  // Create WebSocket if it doesn't exist
  if (!ws || ws.readyState === WebSocket.CLOSED) {
    createWebSocket();
  }

  // Initialize listener set for this key if it doesn't exist
  if (!LISTENERS.has(key)) {
    LISTENERS.set(key, new Set());
  }

  // Add callback to listeners
  const listeners = LISTENERS.get(key)!;
  listeners.add(callback);

  // Return unsubscribe function
  return () => {
    const listeners = LISTENERS.get(key);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        LISTENERS.delete(key);
      }
    }
  };
}

// Initialize WebSocket on module load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    createWebSocket();

    // Maintain WebSocket connection
    setInterval(() => {
      if (!ws || ws.readyState === WebSocket.CLOSED) {
        console.log("WebSocket is closed, attempting to reconnect...");
        reconnectAttempts = 0; // Reset reconnect attempts for manual reconnection
        createWebSocket();
      } else if (ws.readyState === WebSocket.OPEN) {
        // Send ping to keep connection alive
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }, 1000); // Delay initial connection to ensure DOM is loaded
}