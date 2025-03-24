import { Circle, AiFollower } from "@shared/schema";
import { Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";
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
  const [pendingFollowers, setPendingFollowers] = useState<{
    adding: number[];
    removing: number[];
  }>({
    adding: [],
    removing: [],
  });

  const { data: followers } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
  });

  const { data: circleFollowers, isLoading: isLoadingCircleFollowers } = useQuery<AiFollower[]>({
    queryKey: [`/api/circles/${circle.id}/followers`],
  });

  const addFollowerMutation = useMutation({
    mutationFn: async (aiFollowerId: number) => {
      // Track which follower is being added
      setPendingFollowers(prev => ({
        ...prev,
        adding: [...prev.adding, aiFollowerId]
      }));
      const res = await apiRequest(`/api/circles/${circle.id}/followers`, "POST", { aiFollowerId });
      return { result: await res.json(), aiFollowerId };
    },
    onSuccess: (data) => {
      // Remove from pending list when complete
      setPendingFollowers(prev => ({
        ...prev,
        adding: prev.adding.filter(id => id !== data.aiFollowerId)
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/followers`] });
      toast({
        title: "Follower added",
        description: "The AI follower has been added to the circle.",
      });
    },
    onError: (error, aiFollowerId) => {
      // Also remove from pending list on error
      setPendingFollowers(prev => ({
        ...prev,
        adding: prev.adding.filter(id => id !== aiFollowerId)
      }));
    }
  });

  const removeFollowerMutation = useMutation({
    mutationFn: async (followerId: number) => {
      // Track which follower is being removed
      setPendingFollowers(prev => ({
        ...prev,
        removing: [...prev.removing, followerId]
      }));
      await apiRequest(`/api/circles/${circle.id}/followers/${followerId}`, "DELETE");
      return { followerId };
    },
    onSuccess: (data) => {
      // Remove from pending list when complete
      setPendingFollowers(prev => ({
        ...prev,
        removing: prev.removing.filter(id => id !== data.followerId)
      }));
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/followers`] });
      toast({
        title: "Follower removed",
        description: "The AI follower has been removed from the circle.",
      });
    },
    onError: (error, followerId) => {
      // Also remove from pending list on error
      setPendingFollowers(prev => ({
        ...prev,
        removing: prev.removing.filter(id => id !== followerId)
      }));
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
                  const isInCircle = circleFollowers?.some(
                    (f) => f.id === follower.id
                  );
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
                        disabled={
                          pendingFollowers.adding.includes(follower.id) ||
                          pendingFollowers.removing.includes(follower.id)
                        }
                      >
                        {pendingFollowers.adding.includes(follower.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : pendingFollowers.removing.includes(follower.id) ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        {isInCircle && !pendingFollowers.removing.includes(follower.id) && !pendingFollowers.adding.includes(follower.id) 
                          ? "Remove" 
                          : !isInCircle && !pendingFollowers.adding.includes(follower.id) && !pendingFollowers.removing.includes(follower.id)
                          ? "Add"
                          : pendingFollowers.adding.includes(follower.id)
                          ? "Adding..."
                          : "Removing..."}
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
