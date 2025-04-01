import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, hasCirclePermission } from './middleware';

const router = Router();

/**
 * IMPORTANT: The circle follower management endpoints are directly registered in routes.ts
 * to ensure they have priority over these router-based routes. This is necessary to fix
 * route conflicts that were causing errors in the frontend.
 * 
 * See the direct implementations in routes.ts for the following endpoints:
 * - GET /api/circles/:id/followers
 * - POST /api/circles/:id/followers
 * - DELETE /api/circles/:id/followers/:followerId
 * - PATCH /api/circles/:id/followers/:followerId/toggle-mute
 */

/*
// These routes are commented out because they are now directly implemented in routes.ts
// Keeping them here for reference and documentation purposes

// POST /api/circles/:id/followers - Add follower to circle
router.post('/:circleId/followers', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  const { aiFollowerId } = req.body;

  try {
    // Allow both owners and collaborators to manage followers
    const hasPermission = await hasCirclePermission(
      circleId, 
      req.user!.id, 
      storage,
      "collaborator"
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify follower exists
    const follower = await storage.getAiFollower(aiFollowerId);
    if (!follower) {
      return res.status(404).json({ message: "AI Follower not found" });
    }

    // Check if follower is already in the circle
    const followers = await storage.getCircleFollowers(circleId);
    if (followers.some(f => f.id === aiFollowerId)) {
      return res.status(400).json({ message: "AI Follower is already in this circle" });
    }

    // Add follower to circle
    await storage.addCircleFollower(circleId, aiFollowerId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error adding follower to circle:", error);
    res.status(500).json({ message: "Failed to add follower to circle" });
  }
});

// DELETE /api/circles/:id/followers/:followerId - Remove follower from circle
router.delete('/:circleId/followers/:followerId', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  const followerId = parseInt(req.params.followerId);

  try {
    // Allow both owners and collaborators to manage followers
    const hasPermission = await hasCirclePermission(
      circleId, 
      req.user!.id, 
      storage,
      "collaborator"
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Remove follower from circle
    await storage.removeCircleFollower(circleId, followerId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error removing follower from circle:", error);
    res.status(500).json({ message: "Failed to remove follower from circle" });
  }
});

// GET /api/circles/:id/followers - Get circle followers
router.get('/:circleId/followers', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  
  try {
    // Check if user has access to this circle
    const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    const followers = await storage.getCircleFollowers(circleId);
    res.json(followers);
  } catch (error) {
    console.error("Error getting circle followers:", error);
    res.status(500).json({ message: "Failed to get circle followers" });
  }
});

// PATCH /api/circles/:id/followers/:followerId/toggle-mute - Toggle follower mute status
router.patch('/:circleId/followers/:followerId/toggle-mute', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  const followerId = parseInt(req.params.followerId);
  
  try {
    // Allow both owners and collaborators to manage followers
    const hasPermission = await hasCirclePermission(
      circleId, 
      req.user!.id, 
      storage,
      "collaborator"
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Get the current follower state
    const follows = await storage.getCircleFollowerRelationship(circleId, followerId);
    if (!follows) {
      return res.status(404).json({ message: "Follower not found in this circle" });
    }

    // Toggle mute status
    const muted = !follows.muted;
    await storage.updateCircleFollowerRelationship(circleId, followerId, { muted });
    res.json({ muted });
  } catch (error) {
    console.error("Error toggling follower mute status:", error);
    res.status(500).json({ message: "Failed to toggle follower mute status" });
  }
});
*/

export default router;