import express, { Express } from 'express';
import session from 'express-session';
import passport from 'passport';
import { Server } from 'http';

/**
 * Sets up an Express app for testing
 * @returns {Promise<{app: Express, server: Server}>} Express app and server
 */
export async function setupTestApp(): Promise<{ app: Express; server: Server }> {
  // Create an Express app
  const app = express();
  
  // Configure middleware
  app.use(express.json());
  
  // Configure session middleware for testing
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false,
      cookie: { secure: false }
    })
  );
  
  // Configure passport
  app.use(passport.initialize());
  app.use(passport.session());
  
  // In a real implementation, we would setup auth routes and API routes
  // For testing we can mock these or implement dummy routes
  
  // Add server health endpoint for testing
  app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });
  
  // Start the server
  const server = app.listen(0); // Use any available port
  
  return { app, server };
}

/**
 * Closes the test server
 * @param {Server} server - The HTTP server to close
 * @returns {Promise<void>}
 */
export async function closeTestApp(server: Server): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => {
      resolve();
    });
  });
}

/**
 * Resets the app state between tests
 * @param {Express} app - The Express app to reset
 * @returns {Promise<void>}
 */
export async function resetAppState(app: Express): Promise<void> {
  // This function can be expanded to reset database state, clear caches, etc.
  return Promise.resolve();
}