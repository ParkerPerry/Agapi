import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AiFollower, AiFollowerCollective } from "@shared/schema";
import type { AIFollowerProfile } from "@shared/follower-profile-schema";

export function useCreateFollower() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      personality: string; 
      avatarUrl: string;
      responsiveness: "instant" | "active" | "casual" | "zen";
    }) => {
      return await apiRequest("/api/followers", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      toast({
        title: "Follower created",
        description: "Your new AI follower has been created successfully.",
      });
    },
  });
}

export function useImportFollower() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: AIFollowerProfile) => {
      return await apiRequest("/api/followers/import", "POST", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      toast({
        title: "Follower imported",
        description: "Your AI follower has been imported successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error importing follower",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

// Response type definition from Collective Creation API
interface CollectiveResponse {
  message: string;
  collective: AiFollowerCollective;
  followers: AiFollower[];
}

export function useCreateCollective() {
  const { toast } = useToast();
  return useMutation<
    CollectiveResponse,
    Error,
    { 
      collectiveName: string; 
      personality: string;
      count: number;
      avatarPrefix?: string;
      responsiveness: "instant" | "active" | "casual" | "zen";
      responsivenessOptions?: ("instant" | "active" | "casual" | "zen")[];
      responseDelay?: {
        min: number;
        max: number;
      };
      namingOption?: "sequential" | "dynamic";
      generateDynamicAvatars?: boolean;
    }
  >({
    mutationFn: async (data) => {
      // apiRequest already returns the parsed JSON data, but need to cast it properly
      const response = await apiRequest("/api/followers/collective", "POST", data);
      return response as unknown as CollectiveResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      toast({
        title: "AI Collective created",
        description: `Successfully created ${data?.followers?.length || 'multiple'} AI followers in the collective.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error creating collective",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useUpdateFollower() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: {
      id: number;
      name: string;
      personality: string;
      responsiveness: "instant" | "active" | "casual" | "zen";
      background?: string;
      communicationStyle?: string;
      interests?: string[];
      interactionPreferences?: {
        likes: string[];
        dislikes: string[];
      };
      active?: boolean; // Add active property to handle activation/deactivation
    }) => {
      console.log("[Mutation] Updating follower:", data);
      return await apiRequest(`/api/followers/${data.id}`, "PATCH", data);
    },
    onSuccess: (response, variables) => {
      // Invalidate both the follower list and the specific follower
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/followers/${variables.id}`] });
      
      // Show appropriate message based on whether we're toggling active state
      if (variables.active !== undefined) {
        toast({
          title: variables.active ? "Follower activated" : "Follower deactivated",
          description: `The AI follower has been ${variables.active ? "activated" : "deactivated"} successfully.`,
        });
      } else {
        toast({
          title: "Follower updated",
          description: "The AI follower has been updated successfully.",
        });
      }
    },
  });
}

// Note: This function is deprecated and was replaced by useUpdateFollower with the active property.
// It's kept for backward compatibility with other components that may still use it.
export function useToggleFollowerActive() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (followerId: number) => {
      return await apiRequest(`/api/followers/${followerId}/toggle-active`, "POST");
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      toast({
        title: data.active ? "Follower activated" : "Follower deactivated",
        description: `The AI follower has been ${data.active ? "activated" : "deactivated"} successfully.`,
      });
    },
  });
}

export function useDeleteFollower() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (followerId: number) => {
      await apiRequest(`/api/followers/${followerId}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      toast({
        title: "Follower deleted",
        description: "The AI follower has been permanently deleted.",
      });
    },
  });
}

// Response type definition from Clone Factory API
interface CloneResponse {
  message: string;
  collectiveId: number;
  followers: AiFollower[];
}

export function useCloneFollower() {
  const { toast } = useToast();
  return useMutation<
    CloneResponse, 
    Error,
    {
      templateFollowerId: number;
      collectiveName: string;
      description: string;
      cloneCount: number;
      variationLevel: number;
      customInstructions: string;
      namingOption?: 'dynamic' | 'sequential';
      generateDynamicAvatars?: boolean;
    }
  >({
    mutationFn: async (data) => {
      // apiRequest already returns the parsed JSON data, but need to cast it properly
      const response = await apiRequest("/api/followers/clone", "POST", data);
      return response as unknown as CloneResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers/collectives"] });
      toast({
        title: "Clone Factory completed",
        description: `Successfully created ${data?.followers?.length || 'multiple'} clones of your template follower.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error cloning followers",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}
