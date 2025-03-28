import { useQuery } from "@tanstack/react-query";

// Lab type definitions
export interface LabMetrics {
  id?: number;
  labId: number;
  postCount: number;
  commentCount: number;
  followerCount: number;
  additionalMetrics?: {
    likeCount?: number;
    avgResponseTime?: number;
    engagement?: number;
  } | null;
  updatedAt?: Date;
}

export interface Lab {
  id: number;
  name: string;
  description: string | null;
  status: "draft" | "active" | "completed";
  circleId: number;
  circleName?: string;
  createdAt: Date;
  updatedAt?: Date | null;
  metrics?: LabMetrics;
}

export interface LabPost {
  id: number;
  labId: number;
  content: string;
  order: number;
  published: boolean;
  publishedAt: Date | null;
  publishedPostId: number | null;
  createdAt: Date;
  status?: "draft" | "published"; // Computed property based on 'published' field
}

/**
 * Hook to fetch all labs
 */
export function useLabs() {
  return useQuery<Lab[]>({
    queryKey: ["/api/labs"],
    queryFn: undefined,
  });
}

/**
 * Hook to fetch a specific lab by ID
 */
export function useLab(labId: number | null) {
  return useQuery<Lab>({
    queryKey: ["/api/labs", labId],
    queryFn: undefined,
    enabled: !!labId,
  });
}

/**
 * Hook to fetch posts for a specific lab
 */
export function useLabPosts(labId: number | null) {
  return useQuery<LabPost[]>({
    queryKey: ["/api/labs", labId, "posts"],
    queryFn: undefined,
    enabled: !!labId,
  });
}

/**
 * Hook to fetch metrics for a specific lab
 */
export function useLabMetrics(labId: number | null) {
  return useQuery<LabMetrics>({
    queryKey: ["/api/labs", labId, "metrics"],
    queryFn: undefined,
    enabled: !!labId,
  });
}