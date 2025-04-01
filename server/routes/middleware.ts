import { Request, Response, NextFunction } from 'express';
import { IStorage } from "../storage";

/**
 * Authentication middleware - ensures user is authenticated
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.sendStatus(401);
  }
  next();
}

/**
 * Check if user has permissions for a circle
 */
export async function hasCirclePermission(
  circleId: number,
  userId: number,
  storage: IStorage,
  requiredRole: "owner" | "collaborator" | "viewer" = "viewer"
): Promise<boolean> {
  console.log("[Permissions] Checking permissions:", { circleId, userId, requiredRole });

  const circle = await storage.getCircle(circleId);
  if (!circle) {
    console.log("[Permissions] Circle not found:", circleId);
    return false;
  }

  // Circle owner has all permissions
  if (circle.userId === userId) {
    console.log("[Permissions] User is circle owner, granting all permissions");
    return true;
  }

  // Check member role
  const members = await storage.getCircleMembers(circleId);
  const member = members.find(m => m.userId === userId);

  // Check if user has a pending invitation
  const invitations = await storage.getUserPendingInvitations(userId);
  const hasPendingInvitation = invitations.some(inv => inv.circleId === circleId && inv.status === "pending");

  if (hasPendingInvitation) {
    console.log("[Permissions] User has pending invitation, granting viewer access");
    return requiredRole === "viewer";
  }

  if (!member) {
    console.log("[Permissions] User is not a member of the circle");
    return false;
  }

  console.log("[Permissions] User role:", member.role);

  switch (requiredRole) {
    case "owner":
      console.log("[Permissions] Owner permission required, denying non-owner");
      return false;
    case "collaborator":
      const hasCollabPermission = member.role === "collaborator";
      console.log("[Permissions] Collaborator permission check:", hasCollabPermission);
      return hasCollabPermission;
    case "viewer":
      console.log("[Permissions] Viewer permission granted");
      return true;
    default:
      console.log("[Permissions] Unknown role requested:", requiredRole);
      return false;
  }
}

/**
 * Utility helper functions for controllers
 */
export function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

export function getDefaultDelay(responsiveness: string = "active") {
  const baseDelay = 2000; // 2 seconds base delay
  const jitter = Math.random() * 1000; // Up to 1 second of random jitter
  
  let multiplier = 1;
  switch (responsiveness) {
    case "very_active":
      multiplier = 0.5;
      break;
    case "active":
      multiplier = 1;
      break;
    case "normal":
      multiplier = 1.5;
      break;
    case "relaxed":
      multiplier = 2;
      break;
    case "very_relaxed":
      multiplier = 3;
      break;
    default:
      multiplier = 1;
  }
  
  return Math.floor((baseDelay * multiplier) + jitter);
}