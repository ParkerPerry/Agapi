
let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 10;
const listeners: Set<(data: any) => void> = new Set();

// Reset reconnection attempts when the page gains focus
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    reconnectAttempts = 0;
    
    // If we don't have an active connection, try to establish one
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      createWebSocket();
    }
  });
}

export function createWebSocket() {
  // Clear any existing reconnection attempts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // If there's an existing connection, close it
  if (ws) {
    console.log("Closing existing WebSocket connection");
    try {
      ws.onclose = null; // Prevent the reconnect logic from running
      ws.close();
    } catch (err) {
      console.error("Error closing existing WebSocket:", err);
    }
    ws = null;
  }

  try {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    console.log(`Connecting to WebSocket at ${wsUrl}`);

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("WebSocket connection established");
      reconnectAttempts = 0; // Reset reconnect attempts on successful connection
      
      // Start the ping interval
      startPingInterval();
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("WebSocket received message:", data.type);
        
        // Handle server pings
        if (data.type === 'server-ping') {
          ws?.send(JSON.stringify({ type: 'pong' }));
          return;
        }
        
        // Notify all listeners
        listeners.forEach(listener => {
          try {
            listener(data);
          } catch (err) {
            console.error("Error in WebSocket listener:", err);
          }
        });
      } catch (err) {
        console.error("Error processing WebSocket message:", err);
      }
    };

    ws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      stopPingInterval();

      if (event.code === 1000 || event.code === 1001) {
        // Normal closure, don't reconnect
        console.log("WebSocket closed normally, not reconnecting");
        return;
      }
      
      if (event.code === 1008) {
        console.error("WebSocket closed due to authentication failure");
        // Don't reconnect on auth failures
        return;
      }

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

// Ping interval to keep the connection alive
let pingInterval: NodeJS.Timeout | null = null;

function startPingInterval() {
  if (pingInterval) {
    clearInterval(pingInterval);
  }
  
  pingInterval = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({ type: 'ping' }));
      } catch (err) {
        console.error("Error sending ping:", err);
      }
    } else {
      stopPingInterval();
    }
  }, 20000); // Send a ping every 20 seconds
}

function stopPingInterval() {
  if (pingInterval) {
    clearInterval(pingInterval);
    pingInterval = null;
  }
}

// Subscribe to WebSocket messages
export function subscribeToWebSocket(callback: (data: any) => void): () => void {
  listeners.add(callback);
  
  // If we don't have an active connection, create one
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    createWebSocket();
  }
  
  // Return unsubscribe function
  return () => {
    listeners.delete(callback);
  };
}

// Get WebSocket connection status
export function getWebSocketStatus(): 'connecting' | 'open' | 'closing' | 'closed' | 'none' {
  if (!ws) return 'none';
  
  switch (ws.readyState) {
    case WebSocket.CONNECTING:
      return 'connecting';
    case WebSocket.OPEN:
      return 'open';
    case WebSocket.CLOSING:
      return 'closing';
    case WebSocket.CLOSED:
      return 'closed';
    default:
      return 'none';
  }
}
