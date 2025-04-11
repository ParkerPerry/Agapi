/**
 * Test setup helpers
 * Provides functions to create and manage a test instance of the application
 */

import { Express } from 'express';
import { Server } from 'http';
import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { OpenAI } from 'openai';

import { mockStorage } from './mock-storage';
import { IStorage } from '../../../server/storage';

// In-memory session store for tests
const MemoryStore = require('memorystore')(session);

/**
 * Set up a test application instance
 * @returns {Promise<{ app: Express, server: Server }>} Express app and server
 */
export async function setupTestApp(): Promise<{ app: Express, server: Server }> {
  // Create Express app
  const app = express();

  // Set up middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Configure session middleware
  app.use(session({
    secret: 'test-secret',
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    })
  }));
  
  // Initialize passport for authentication
  app.use(passport.initialize());
  app.use(passport.session());
  
  // Configure passport local strategy
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await mockStorage.getUserByUsername(username);
      
      if (!user) {
        return done(null, false, { message: 'Incorrect username' });
      }
      
      // For tests, just check direct password match (no hashing)
      if (user.password !== password) {
        return done(null, false, { message: 'Incorrect password' });
      }
      
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }));
  
  // Serialize/deserialize user for session
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await mockStorage.getUserById(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });
  
  // Mock OpenAI for tests
  const mockOpenAI = new OpenAI({ apiKey: 'mock-key' });
  
  // Set up app context and dependency injection
  app.use((req, res, next) => {
    // Inject dependencies into request
    req.context = {
      storage: mockStorage as IStorage,
      openai: mockOpenAI
    };
    next();
  });
  
  // Set up routes
  const authRoutes = require('../../../server/routes/auth');
  app.use('/api/auth', authRoutes);
  
  const followerRoutes = require('../../../server/routes/followers');
  app.use('/api/followers', followerRoutes);
  
  const postRoutes = require('../../../server/routes/posts');
  app.use('/api/posts', postRoutes);
  
  const circleRoutes = require('../../../server/routes/circles');
  app.use('/api/circles', circleRoutes);
  
  // Create server
  const server = app.listen(0); // Use any available port for tests
  
  return { app, server };
}

/**
 * Close the test application
 * @param {Server} server - HTTP server to close
 * @returns {Promise<void>}
 */
export async function closeTestApp(server: Server): Promise<void> {
  return new Promise((resolve, reject) => {
    server.close((err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Reset application state between tests
 */
export function resetAppState(): void {
  // Reset mock storage to empty state
  mockStorage.users = [];
  mockStorage.followers = [];
  mockStorage.posts = [];
  mockStorage.circles = [];
  mockStorage.circleMembers = [];
  mockStorage.labs = [];
  mockStorage.followerCollectives = [];
  mockStorage.notifications = [];
  mockStorage.directMessages = [];
  mockStorage.followerResponses = [];
}

/**
 * Type declaration for Express request with context
 */
declare global {
  namespace Express {
    interface Request {
      context: {
        storage: IStorage;
        openai: OpenAI;
      };
    }
  }
  
  // Global test environment
  var testEnv: {
    mockStorage: typeof mockStorage;
  };
}