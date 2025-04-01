import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, hasCirclePermission } from './middleware';

const router = Router();

/**
 * POST /api/circles/:id/collectives - Add collective to circle
 */
router.post('/:circleId/collectives', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  const { collectiveId } = req.body;

  try {
    // Allow both owners and collaborators to manage collectives
    const hasPermission = await hasCirclePermission(
      circleId, 
      req.user!.id, 
      storage,
      "collaborator"
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Verify collective exists
    const collective = await storage.getAiCollective(collectiveId);
    if (!collective) {
      return res.status(404).json({ message: "Collective not found" });
    }

    // Check if collective is already in the circle
    const collectives = await storage.getCircleCollectives(circleId);
    if (collectives.some(c => c.id === collectiveId)) {
      return res.status(400).json({ message: "Collective is already in this circle" });
    }

    // Add collective to circle
    await storage.addCircleCollective(circleId, collectiveId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error adding collective to circle:", error);
    res.status(500).json({ message: "Failed to add collective to circle" });
  }
});

/**
 * DELETE /api/circles/:id/collectives/:collectiveId - Remove collective from circle
 */
router.delete('/:circleId/collectives/:collectiveId', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  const collectiveId = parseInt(req.params.collectiveId);

  try {
    // Allow both owners and collaborators to manage collectives
    const hasPermission = await hasCirclePermission(
      circleId, 
      req.user!.id, 
      storage,
      "collaborator"
    );
    
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Remove collective from circle
    await storage.removeCircleCollective(circleId, collectiveId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error removing collective from circle:", error);
    res.status(500).json({ message: "Failed to remove collective from circle" });
  }
});

/**
 * GET /api/circles/:id/collectives - Get circle collectives
 */
router.get('/:circleId/collectives', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  
  try {
    // Check if user has access to this circle
    const hasPermission = await hasCirclePermission(circleId, req.user!.id, storage);
    if (!hasPermission) {
      return res.status(403).json({ message: "Access denied" });
    }

    const collectives = await storage.getCircleCollectives(circleId);
    res.json(collectives);
  } catch (error) {
    console.error("Error getting circle collectives:", error);
    res.status(500).json({ message: "Failed to get circle collectives" });
  }
});

export default router;