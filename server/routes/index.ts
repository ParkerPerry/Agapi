/**
 * Centralized routes export module
 * 
 * This file serves as the main entry point for all route modules in the application.
 * Routes are organized by domain/feature for better maintainability and separation of concerns.
 */

import userRoutes from './userRoutes';               // User account management
import notificationRoutes from './notificationRoutes'; // User notifications
import circleRoutes from './circleRoutes';           // Circle management
import circleFollowerRoutes from './circleFollowerRoutes'; // Circle-follower relationships
import circleCollectiveRoutes from './circleCollectiveRoutes'; // Circle-collective relationships
import followerRoutes from './followerRoutes';       // AI follower management
import postRoutes from './postRoutes';               // User and AI posts
import directChatRoutes from './directChatRoutes';   // Direct messaging with AI followers
import toolRoutes from './toolRoutes';               // AI tools and capabilities
import labRoutes from './labRoutes';                 // Experimentation features
import healthRoutes from './healthRoutes';           // System health monitoring

export {
  userRoutes,
  notificationRoutes,
  circleRoutes,
  circleFollowerRoutes,
  circleCollectiveRoutes,
  followerRoutes,
  postRoutes,
  directChatRoutes,
  toolRoutes,
  labRoutes,
  healthRoutes
};