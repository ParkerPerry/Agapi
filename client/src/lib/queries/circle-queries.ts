import { useQuery } from "@tanstack/react-query";

/**
 * Get all circles owned or joined by the current user
 */
export function useCircles() {
  return useQuery({
    queryKey: ["/api/circles"],
    queryFn: undefined,
  });
}

/**
 * Get details of a specific circle
 */
export function useCircle(circleId: number | null) {
  return useQuery({
    queryKey: ["/api/circles", circleId],
    queryFn: undefined,
    enabled: !!circleId,
  });
}

/**
 * Get circle members
 */
export function useCircleMembers(circleId: number | null) {
  return useQuery({
    queryKey: ["/api/circles", circleId, "members"],
    queryFn: undefined,
    enabled: !!circleId,
  });
}

/**
 * Get AI followers in a circle
 */
export function useCircleFollowers(circleId: number | null) {
  return useQuery({
    queryKey: ["/api/circles", circleId, "followers"],
    queryFn: undefined,
    enabled: !!circleId,
  });
}