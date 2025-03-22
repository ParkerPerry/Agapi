import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface UserProfileUpdate {
  avatarUrl?: string;
  bio?: string;
}

/**
 * Mutation hook for updating user profile information
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UserProfileUpdate) => {
      const response = await apiRequest("/api/user/profile", "PATCH", data);
      return response;
    },
    onSuccess: () => {
      // Invalidate user data queries to refetch latest profile
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
  });
}