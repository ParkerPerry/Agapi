let ws: WebSocket | null = null;
let reconnectTimeout: NodeJS.Timeout | null = null;

export function createWebSocket() {
  // Clear any existing reconnection attempts
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }

  // If there's an existing connection, close it
  if (ws) {
    ws.close();
    ws = null;
  }

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const wsUrl = `${protocol}//${window.location.host}/ws`;

  ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log("WebSocket connection established");
  };

  ws.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  ws.onclose = (event) => {
    console.log("WebSocket connection closed:", event.code, event.reason);

    if (event.code === 1008) {
      console.error("WebSocket closed due to authentication failure");
      // Don't reconnect on auth failures
      return;
    }

    // Attempt to reconnect with exponential backoff
    const backoff = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
    reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempts + 1})...`);
      reconnectAttempts++;
      createWebSocket();
    }, backoff);
  };

  return ws;
}

// Keep track of reconnection attempts
let reconnectAttempts = 0;

// Reset reconnection attempts when the page gains focus
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    reconnectAttempts = 0;
  });
}