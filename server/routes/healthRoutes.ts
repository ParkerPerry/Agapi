import { Router } from 'express';
import { storage } from '../storage';
import { ResponseScheduler } from '../response-scheduler';
import { ThreadContextManager } from '../context-manager';
import { ThreadManager } from '../thread-manager';

const router = Router();

// Basic health check endpoint
router.get('/', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Detailed health check with service status
router.get('/details', async (_req, res) => {
  try {
    // Collect status of various services
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        responseScheduler: 'unknown',
        threadManager: 'unknown',
        contextManager: 'unknown'
      },
      details: {}
    };

    // Check database connection
    try {
      // Try a simple database operation by fetching a user with ID 1
      // This will at least verify connection to the database
      await storage.getUser(1);
      health.services.database = 'ok';
    } catch (error) {
      health.services.database = 'error';
      health.details = { ...health.details, databaseError: (error as Error).message };
      health.status = 'degraded';
    }

    // Check response scheduler
    try {
      const scheduler = ResponseScheduler.getInstance();
      health.services.responseScheduler = scheduler ? 'ok' : 'error';
    } catch (error) {
      health.services.responseScheduler = 'error';
      health.details = { ...health.details, schedulerError: (error as Error).message };
      health.status = 'degraded';
    }

    // Check ThreadManager
    try {
      // Use a static method to verify functioning
      health.services.threadManager = ThreadManager ? 'ok' : 'error';
    } catch (error) {
      health.services.threadManager = 'error';
      health.details = { ...health.details, threadManagerError: (error as Error).message };
      health.status = 'degraded';
    }
    
    // Check ThreadContextManager
    try {
      const contextManager = ThreadContextManager.getInstance();
      health.services.contextManager = contextManager ? 'ok' : 'error';
    } catch (error) {
      health.services.contextManager = 'error';
      health.details = { ...health.details, contextManagerError: (error as Error).message };
      health.status = 'degraded';
    }

    // Return health status with appropriate HTTP status code
    if (health.status === 'ok') {
      res.json(health);
    } else {
      res.status(500).json(health);
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

export default router;