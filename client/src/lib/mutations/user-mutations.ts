import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../queryClient";
import { User } from "@shared/schema";

interface UserProfileUpdate {
  avatarUrl?: string;
  bio?: string;
}

export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: async (data: UserProfileUpdate) => {
      const res = await apiRequest("PATCH", "/api/user/profile", data);
      return await res.json() as User;
    },
    onSuccess: (updatedUser) => {
      // Update user data in cache
      queryClient.setQueryData(["/api/user"], updatedUser);
    },
  });
}