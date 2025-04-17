import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import type { Express } from 'express';
import { storage } from './storage';
import jwt from 'jsonwebtoken';

// WebSocket client connections
interface ExtendedWebSocket extends WebSocket {
  isAlive: boolean;
  userId?: number;
  sessionID?: string;
}

// Active WebSocket connections
const clients = new Set<ExtendedWebSocket>();

/**
 * Initialize WebSocket server
 * @param server HTTP server instance
 * @param app Express app instance
 */
export function initializeWebSocketServer(server: Server, app: Express) {
  console.log('[WebSocket] Initializing WebSocket server');
  
  // Create WebSocket server attached to the HTTP server
  const wss = new WebSocketServer({ 
    noServer: true,
    path: '/ws',
  });

  // Handle HTTP server upgrade event to establish WebSocket connection
  server.on('upgrade', (request, socket, head) => {
    console.log('[WebSocket] Received upgrade request for path:', request.url);
    
    // Parse the URL to handle just the path portion, ignoring query params
    const requestUrl = new URL(
      request.url || '', 
      `http://${request.headers.host}`
    );
    
    // Only handle WebSocket upgrade requests for /ws path
    if (requestUrl.pathname === '/ws') {
      try {
        console.log('[WebSocket] Processing WebSocket upgrade for /ws path');
        wss.handleUpgrade(request, socket, head, (ws) => {
          console.log('[WebSocket] Upgrade successful, emitting connection event');
          wss.emit('connection', ws, request);
        });
      } catch (error) {
        console.error('[WebSocket] Error handling upgrade:', error);
        socket.destroy();
      }
    } else {
      // Not a WebSocket upgrade request for our path
      console.log('[WebSocket] Ignoring non-WebSocket path:', requestUrl.pathname);
      socket.destroy();
    }
  });

  // Handle new WebSocket connections
  wss.on('connection', (ws: WebSocket) => {
    console.log('[WebSocket] New connection established');
    
    const extWs = ws as ExtendedWebSocket;
    extWs.isAlive = true;
    clients.add(extWs);

    // Send initial welcome message
    ws.send(JSON.stringify({
      type: 'server-info',
      message: 'WebSocket connection established',
      timestamp: new Date().toISOString()
    }));

    // Handle incoming messages
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('[WebSocket] Received message:', data.type);

        // Handle ping messages
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
          return;
        }

        // Handle authentication messages
        if (data.type === 'authenticate') {
          handleAuthentication(extWs, data);
          return;
        }

        // Handle other message types (requires authentication)
        if (!extWs.userId) {
          ws.send(JSON.stringify({
            type: 'error',
            code: 401,
            message: 'Authentication required'
          }));
          return;
        }

        // Process other message types as needed
        // ...

      } catch (error) {
        console.error('[WebSocket] Error processing message:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Error processing message'
        }));
      }
    });

    // Handle WebSocket connection close
    ws.on('close', () => {
      console.log('[WebSocket] Connection closed');
      clients.delete(extWs);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error('[WebSocket] Connection error:', error);
      clients.delete(extWs);
    });

    // Setup ping/pong for connection health checks
    extWs.on('pong', () => {
      extWs.isAlive = true;
    });
  });

  // Setup interval for ping/pong health checks
  const interval = setInterval(() => {
    wss.clients.forEach((ws) => {
      const extWs = ws as ExtendedWebSocket;
      
      if (extWs.isAlive === false) {
        console.log('[WebSocket] Terminating inactive connection');
        extWs.terminate();
        clients.delete(extWs);
        return;
      }
      
      extWs.isAlive = false;
      extWs.ping();
    });
  }, 30000); // Check every 30 seconds

  // Clean up interval on server close
  wss.on('close', () => {
    clearInterval(interval);
  });

  console.log('[WebSocket] Server initialized');
  return wss;
}

/**
 * Handle client authentication
 */
function handleAuthentication(ws: ExtendedWebSocket, data: any) {
  try {
    const { token } = data;
    
    if (!token) {
      ws.send(JSON.stringify({
        type: 'error',
        code: 401,
        message: 'Authentication token required'
      }));
      return;
    }

    // For development purposes, handle both JWT and our custom token format
    // In production, you would use proper JWT verification
    let userId;
    
    // Check if token is our custom format (auth-token-for-user-123)
    if (token.startsWith('auth-token-for-user-')) {
      // Extract user ID from token
      userId = parseInt(token.replace('auth-token-for-user-', ''), 10);
      console.log(`[WebSocket] User authenticated with custom token, extracted userId: ${userId}`);
    } else {
      // Try to verify as JWT
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        userId = decoded.userId;
        ws.sessionID = decoded.sessionID;
      } catch (jwtError) {
        console.error('[WebSocket] JWT verification failed:', jwtError);
        ws.send(JSON.stringify({
          type: 'error',
          code: 401,
          message: 'Invalid authentication token'
        }));
        return;
      }
    }
    
    // Validate user ID
    if (!userId || isNaN(userId)) {
      ws.send(JSON.stringify({
        type: 'error',
        code: 401,
        message: 'Invalid user ID in token'
      }));
      return;
    }
    
    // Set authenticated user ID
    ws.userId = userId;
    console.log(`[WebSocket] User authenticated: ${ws.userId}`);
    
    // Send success response
    ws.send(JSON.stringify({
      type: 'auth-success',
      userId: ws.userId,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error('[WebSocket] Authentication error:', error);
    ws.send(JSON.stringify({
      type: 'error',
      code: 401,
      message: 'Invalid authentication token'
    }));
  }
}

/**
 * Broadcast a message to all connected clients or specific users
 */
export function broadcastWebSocketMessage(message: any, userIds?: number[]) {
  const serializedMessage = JSON.stringify(message);
  
  // Using forEach instead of for...of to avoid iteration issues
  clients.forEach(client => {
    // Skip clients without authentication if userIds is not provided
    if (!client.userId && userIds) {
      return;
    }
    
    // Send only to specific users if userIds is provided
    if (userIds && !userIds.includes(client.userId!)) {
      return;
    }
    
    // Send the message if client is connected
    if (client.readyState === WebSocket.OPEN) {
      client.send(serializedMessage);
    }
  });
}