import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from './middleware';
import { User } from '@shared/schema';

const router = Router();

/**
 * PATCH /api/user/profile - Update user profile
 */
router.patch('/profile', requireAuth, async (req, res) => {
  console.log("[API] PATCH /api/user/profile - Request received");
  console.log("[API] Request body:", req.body);
  
  try {
    const updates: Partial<Pick<User, "avatarUrl" | "bio">> = {};
    
    // Only include provided fields
    if (req.body.avatarUrl !== undefined) {
      updates.avatarUrl = req.body.avatarUrl;
    }
    
    if (req.body.bio !== undefined) {
      updates.bio = req.body.bio;
    }
    
    // Update the user profile
    const updatedUser = await storage.updateUser(req.user!.id, updates);
    console.log("[API] User profile updated successfully");
    
    res.json(updatedUser);
  } catch (error) {
    console.error("[API] Error updating user profile:", error);
    res.status(500).json({ message: "Failed to update user profile" });
  }
});

export default router;