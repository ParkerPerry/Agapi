import { Circle, AiFollower } from "@shared/schema";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface CircleFollowerManagerProps {
  circle: Circle;
}

export function CircleFollowerManager({ circle }: CircleFollowerManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Track pending follower operations locally
  const [pendingChanges, setPendingChanges] = useState<Record<number, "add" | "remove">>({});

  const { data: followers } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
  });

  const { data: circleFollowers, isLoading: isLoadingCircleFollowers } = useQuery<AiFollower[]>({
    queryKey: [`/api/circles/${circle.id}/followers`],
  });

  // Reset pending changes when circle followers data is refreshed
  useEffect(() => {
    if (circleFollowers) {
      setPendingChanges({});
    }
  }, [circleFollowers]);

  const addFollowerMutation = useMutation({
    mutationFn: async (aiFollowerId: number) => {
      // Optimistically update UI
      setPendingChanges(prev => ({ ...prev, [aiFollowerId]: "add" }));
      try {
        // apiRequest already returns the parsed JSON response
        return await apiRequest(`/api/circles/${circle.id}/followers`, "POST", { aiFollowerId });
      } catch (error) {
        console.error("Error in addFollowerMutation:", error);
        // We're rethrowing the error so it can be caught by onError
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/followers`] });
      toast({
        title: "Follower added",
        description: "The AI follower has been added to the circle.",
      });
    },
    onError: (error, aiFollowerId) => {
      console.error("Error adding follower:", error);
      // Remove the pending change on error
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[aiFollowerId as number];
        return updated;
      });
      toast({
        title: "Error",
        description: "Failed to add follower to the circle.",
        variant: "destructive",
      });
    }
  });

  const removeFollowerMutation = useMutation({
    mutationFn: async (followerId: number) => {
      // Optimistically update UI
      setPendingChanges(prev => ({ ...prev, [followerId]: "remove" }));
      try {
        await apiRequest(`/api/circles/${circle.id}/followers/${followerId}`, "DELETE");
        return { success: true };
      } catch (error) {
        // We're rethrowing the error so it can be caught by onError
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/followers`] });
      toast({
        title: "Follower removed",
        description: "The AI follower has been removed from the circle.",
      });
    },
    onError: (error, followerId) => {
      console.error("Error removing follower:", error);
      // Remove the pending change on error
      setPendingChanges(prev => {
        const updated = { ...prev };
        delete updated[followerId as number];
        return updated;
      });
      toast({
        title: "Error",
        description: "Failed to remove follower from the circle.",
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon">
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage AI Followers</DialogTitle>
          <DialogDescription>
            Add or remove AI followers for {circle.name}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ScrollArea className="h-[300px] pr-4">
            {isLoadingCircleFollowers ? (
              <div className="flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {followers?.map((follower) => {
                  // Check for pending changes first
                  const pendingChange = pendingChanges[follower.id];
                  // Calculate real state considering both server data and pending changes
                  const isInCircleFromServer = circleFollowers?.some(f => f.id === follower.id);
                  const isInCircle = pendingChange === "add" ? true : 
                                    pendingChange === "remove" ? false : 
                                    isInCircleFromServer;
                  
                  const isPending = addFollowerMutation.isPending || removeFollowerMutation.isPending;
                  
                  return (
                    <div
                      key={follower.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <img src={follower.avatarUrl} alt={follower.name} />
                          <AvatarFallback>
                            {follower.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{follower.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {follower.personality}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant={isInCircle ? "destructive" : "secondary"}
                        size="sm"
                        onClick={() => {
                          if (isInCircle) {
                            removeFollowerMutation.mutate(follower.id);
                          } else {
                            addFollowerMutation.mutate(follower.id);
                          }
                        }}
                        disabled={isPending}
                      >
                        {isInCircle ? "Remove" : "Add"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
