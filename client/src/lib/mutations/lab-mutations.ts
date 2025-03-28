import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";

/**
 * Hook to create a new lab
 */
export function useCreateLab() {
  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      circleId: number;
    }) => {
      return apiRequest("/api/labs", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
    }
  });
}

/**
 * Hook to update lab status (draft -> active -> completed)
 */
export function useUpdateLabStatus() {
  return useMutation({
    mutationFn: async ({
      labId,
      status
    }: {
      labId: number;
      status: "active" | "completed";
    }) => {
      return apiRequest(`/api/labs/${labId}/status`, "POST", { status });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/labs", variables.labId] });
    }
  });
}

/**
 * Hook to delete a lab
 */
export function useDeleteLab() {
  return useMutation({
    mutationFn: async (labId: number) => {
      return apiRequest(`/api/labs/${labId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
    }
  });
}

/**
 * Hook to create a new post for a lab
 */
export function useCreateLabPost() {
  return useMutation({
    mutationFn: async ({
      labId,
      content,
      order
    }: {
      labId: number;
      content: string;
      order?: number;
    }) => {
      return apiRequest(`/api/labs/${labId}/posts`, "POST", { content, order });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs", variables.labId, "posts"] });
    }
  });
}

/**
 * Hook to publish a lab post to the associated circle
 */
export function usePublishLabPost() {
  return useMutation({
    mutationFn: async ({
      labId,
      postId
    }: {
      labId: number;
      postId: number;
    }) => {
      return apiRequest(`/api/labs/${labId}/posts/${postId}/publish`, "POST");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs", variables.labId, "posts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/labs", variables.labId, "metrics"] });
    }
  });
}

/**
 * Hook to calculate metrics for a lab
 */
export function useCalculateLabMetrics() {
  return useMutation({
    mutationFn: async (labId: number) => {
      return apiRequest(`/api/labs/${labId}/metrics/calculate`, "POST");
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/labs", variables, "metrics"] });
    }
  });
}