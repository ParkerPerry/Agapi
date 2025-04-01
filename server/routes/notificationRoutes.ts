import { Router } from 'express';
import { storage } from '../storage';
import { requireAuth } from './middleware';

const router = Router();

/**
 * GET /api/notifications - Get user notifications
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await storage.getUserNotifications(req.user!.id);
    res.json(notifications);
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({ message: "Failed to get notifications" });
  }
});

/**
 * GET /api/notifications/unread/count - Get unread notification count
 */
router.get('/unread/count', requireAuth, async (req, res) => {
  try {
    const count = await storage.getUnreadNotificationCount(req.user!.id);
    res.json({ count });
  } catch (error) {
    console.error("Error getting unread notification count:", error);
    res.status(500).json({ message: "Failed to get unread notification count" });
  }
});

/**
 * PATCH /api/notifications/:id/read - Mark notification as read
 */
router.patch('/:id/read', requireAuth, async (req, res) => {
  const notificationId = parseInt(req.params.id);
  try {
    await storage.markNotificationRead(notificationId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Failed to mark notification as read" });
  }
});

/**
 * PATCH /api/notifications/read-all - Mark all notifications as read
 */
router.patch('/read-all', requireAuth, async (req, res) => {
  try {
    await storage.markAllNotificationsRead(req.user!.id);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
});

/**
 * DELETE /api/notifications/:id - Delete notification
 */
router.delete('/:id', requireAuth, async (req, res) => {
  const notificationId = parseInt(req.params.id);
  try {
    await storage.deleteNotification(notificationId);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting notification:", error);
    res.status(500).json({ message: "Failed to delete notification" });
  }
});

/**
 * DELETE /api/notifications/delete-all - Delete all notifications
 */
router.delete('/delete-all', requireAuth, async (req, res) => {
  try {
    const userId = req.user!.id;
    
    if (!userId || isNaN(userId)) {
      console.error("Invalid user ID for delete all notifications:", userId);
      return res.status(400).json({ message: "Invalid user ID" });
    }
    
    await storage.deleteAllNotifications(userId);
    console.log(`Successfully deleted all notifications for user ${userId}`);
    res.sendStatus(200);
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    res.status(500).json({ message: "Failed to delete all notifications" });
  }
});

export default router;