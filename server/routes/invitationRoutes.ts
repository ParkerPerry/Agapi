import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth, hasCirclePermission } from './middleware';

const router = Router();

/**
 * GET /api/circles/invitations/pending - Get pending invitations with circle info
 */
router.get('/pending', requireAuth, async (req, res) => {
  try {
    const invitations = await storage.getUserPendingInvitations(req.user!.id);

    // Get circle information for each invitation
    const invitationsWithCircles = await Promise.all(
      invitations.map(async (invitation) => {
        const circle = await storage.getCircle(invitation.circleId);
        return {
          ...invitation,
          circle
        };
      })
    );

    res.json(invitationsWithCircles);
  } catch (error) {
    console.error("Error getting pending invitations:", error);
    res.status(500).json({ message: "Failed to get pending invitations" });
  }
});

/**
 * POST /api/circles/:id/invitations - Create invitation
 */
router.post('/:circleId/invitations', requireAuth, async (req, res) => {
  const circleId = parseInt(req.params.circleId);
  const { username, role } = req.body;

  try {
    // Verify circle ownership and existence
    const circle = await storage.getCircle(circleId);
    if (!circle || circle.userId !== req.user!.id) {
      return res.status(404).json({ message: "Circle not found" });
    }

    // Get invitee user by username
    const invitee = await storage.getUserByUsername(username);
    if (!invitee) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is already a member
    const members = await storage.getCircleMembers(circleId);
    if (members.some(member => member.userId === invitee.id)) {
      return res.status(400).json({ message: "User is already a member of this circle" });
    }

    // Check for existing pending invitation
    const invitations = await storage.getCircleInvitations(circleId);
    if (invitations.some(inv => inv.inviteeId === invitee.id && inv.status === "pending")) {
      return res.status(400).json({ message: "User already has a pending invitation" });
    }

    // Create invitation
    const invitation = await storage.createCircleInvitation({
      circleId,
      inviterId: req.user!.id,
      inviteeId: invitee.id,
      role
    });

    // Update circle visibility to shared
    if (circle.visibility === "private") {
      await storage.updateCircle(circleId, { visibility: "shared" });
    }

    res.status(201).json(invitation);
  } catch (error) {
    console.error("Error creating invitation:", error);
    res.status(500).json({ message: "Failed to create invitation" });
  }
});

/**
 * PATCH /api/circles/invitations/:id - Respond to invitation
 */
router.patch('/:id', requireAuth, async (req, res) => {
  const invitationId = parseInt(req.params.id);
  const { status } = req.body;

  try {
    const invitation = await storage.getCircleInvitation(invitationId);
    if (!invitation || invitation.inviteeId !== req.user!.id) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.status !== "pending") {
      return res.status(400).json({ message: "Invitation has already been responded to" });
    }

    const updatedInvitation = await storage.updateInvitationStatus(invitationId, status);
    console.log(`[Invitations] Invitation ${invitationId} updated to status: ${status}`);
    res.json(updatedInvitation);
  } catch (error) {
    console.error("Error responding to invitation:", error);
    res.status(500).json({ message: "Failed to respond to invitation" });
  }
});

export default router;