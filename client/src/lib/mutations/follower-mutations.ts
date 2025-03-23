import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function useCreateFollower() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { 
      name: string; 
      personality: string; 
      avatarUrl: string;
      responsiveness: "instant" | "active" | "casual" | "zen";
    }) => {
      const res = await apiRequest("/api/followers", "POST", data);
      return res.json();
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

export function useCreateCollective() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: { 
      collectiveName: string; 
      personality: string;
      count: number;
      avatarPrefix?: string;
      responsiveness: "instant" | "active" | "casual" | "zen";
      responseChance: number;
    }) => {
      // apiRequest already returns the parsed JSON data
      return await apiRequest("/api/followers/collective", "POST", data);
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
    }) => {
      console.log("[Mutation] Updating follower:", data);
      return await apiRequest(`/api/followers/${data.id}`, "PATCH", data);
    },
    onSuccess: (_, variables) => {
      // Invalidate both the follower list and the specific follower
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      queryClient.invalidateQueries({ queryKey: [`/api/followers/${variables.id}`] });
      toast({
        title: "Follower updated",
        description: "The AI follower has been updated successfully.",
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
        title: "Follower deactivated",
        description: "The AI follower has been deactivated successfully.",
      });
    },
  });
}

export function useCloneFollower() {
  const { toast } = useToast();
  return useMutation({
    mutationFn: async (data: {
      templateFollowerId: number;
      collectiveName: string;
      description: string;
      cloneCount: number;
      variationLevel: number;
      customInstructions: string;
    }) => {
      // apiRequest already returns the parsed JSON data, we don't need to call .json() again
      return await apiRequest("/api/followers/clone", "POST", data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/followers/collectives"] });
      toast({
        title: "Clone Factory completed",
        description: `Successfully created ${data?.followers?.length || data?.cloneCount || 'multiple'} clones of your template follower.`,
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
