import { Router } from 'express';
import { requireAuth } from './middleware';
import { getAvailableTools } from '../tools';

const router = Router();

/**
 * GET /api/tools - Get available tools
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const tools = await getAvailableTools();
    res.json(tools);
  } catch (error) {
    console.error("Error getting tools:", error);
    res.status(500).json({ message: "Failed to get tools" });
  }
});

export default router;