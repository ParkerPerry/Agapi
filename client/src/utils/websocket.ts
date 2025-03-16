
import { useState, useEffect } from 'react';

// Base WebSocket URL derived from current location
const getWebSocketUrl = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
};

// Create a WebSocket connection with reconnection logic
export function createWebSocket() {
  const ws = new WebSocket(getWebSocketUrl());
  
  let reconnectAttempt = 0;
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second
  
  // Handle connection errors
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  // Handle connection closure
  ws.onclose = (event) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    
    // Only attempt to reconnect if we haven't reached max attempts
    if (reconnectAttempt < maxReconnectAttempts) {
      reconnectAttempt++;
      const delay = reconnectDelay * Math.pow(1.5, reconnectAttempt - 1); // Exponential backoff
      
      console.log(`Attempting to reconnect WebSocket (attempt ${reconnectAttempt})...`);
      setTimeout(() => {
        // Create a new WebSocket instance
        const newWs = createWebSocket();
        
        // Copy over event listeners
        Object.assign(ws, {
          onmessage: newWs.onmessage,
          onopen: newWs.onopen,
          onerror: newWs.onerror,
          onclose: newWs.onclose
        });
      }, delay);
    }
  };
  
  // Handle connection open
  ws.onopen = () => {
    console.log('WebSocket connection established');
    reconnectAttempt = 0; // Reset on successful connection
  };
  
  return ws;
}

// React hook for WebSocket connection
export function useWebSocket() {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  
  useEffect(() => {
    const ws = createWebSocket();
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages(prev => [...prev, data]);
      } catch (err) {
        console.error('Error parsing WebSocket message:', err);
      }
    };
    
    setSocket(ws);
    
    return () => {
      ws.close();
    };
  }, []);
  
  const sendMessage = (message: any) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
    }
  };
  
  return { socket, messages, sendMessage };
}
