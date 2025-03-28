import { useQuery } from "@tanstack/react-query";

/**
 * Hook to fetch all labs
 */
export function useLabs() {
  return useQuery({
    queryKey: ["/api/labs"],
    queryFn: undefined,
  });
}

/**
 * Hook to fetch a specific lab by ID
 */
export function useLab(labId: number | null) {
  return useQuery({
    queryKey: ["/api/labs", labId],
    queryFn: undefined,
    enabled: !!labId,
  });
}

/**
 * Hook to fetch posts for a specific lab
 */
export function useLabPosts(labId: number | null) {
  return useQuery({
    queryKey: ["/api/labs", labId, "posts"],
    queryFn: undefined,
    enabled: !!labId,
  });
}

/**
 * Hook to fetch metrics for a specific lab
 */
export function useLabMetrics(labId: number | null) {
  return useQuery({
    queryKey: ["/api/labs", labId, "metrics"],
    queryFn: undefined,
    enabled: !!labId,
  });
}