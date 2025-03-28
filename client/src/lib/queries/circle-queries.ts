import { useQuery } from "@tanstack/react-query";

// Circle type definition
export interface Circle {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: Date;
  userId: number;
  isDefault: boolean;
  visibility: "private" | "shared";
}

/**
 * Get all circles owned or joined by the current user
 */
export function useCircles() {
  return useQuery<Circle[]>({
    queryKey: ["/api/circles"],
    queryFn: undefined,
  });
}

/**
 * Get details of a specific circle
 */
export function useCircle(circleId: number | null) {
  return useQuery<Circle>({
    queryKey: ["/api/circles", circleId],
    queryFn: undefined,
    enabled: !!circleId,
  });
}

/**
 * Get circle members
 */
export function useCircleMembers(circleId: number | null) {
  return useQuery<{
    id: number;
    userId: number;
    circleId: number;
    role: "owner" | "collaborator" | "viewer";
    status: "active" | "deactivated";
    joinedAt: Date | null;
    username: string;
  }[]>({
    queryKey: ["/api/circles", circleId, "members"],
    queryFn: undefined,
    enabled: !!circleId,
  });
}

/**
 * Get AI followers in a circle
 */
export function useCircleFollowers(circleId: number | null) {
  return useQuery<{
    id: number;
    circleId: number;
    aiFollowerId: number;
    addedAt: Date;
    muted: boolean;
    follower: {
      id: number;
      name: string;
      personality: string;
      avatarUrl: string;
      responsiveness: string;
    };
  }[]>({
    queryKey: ["/api/circles", circleId, "followers"],
    queryFn: undefined,
    enabled: !!circleId,
  });
}