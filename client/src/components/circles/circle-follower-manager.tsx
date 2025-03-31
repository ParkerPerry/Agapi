import { useState, useEffect } from 'react';
import { Circle, AiFollower, AiFollowerCollective } from "@shared/schema";
import { Users, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface CircleFollowerManagerProps {
  circle: Circle;
}

export function CircleFollowerManager({ circle }: CircleFollowerManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("followers");
  
  // =============== FOLLOWERS MANAGEMENT ===============
  // Track pending follower operations locally
  const [pendingFollowerChanges, setPendingFollowerChanges] = useState<Record<number, "add" | "remove">>({});

  const { data: followers } = useQuery<AiFollower[]>({
    queryKey: ["/api/followers"],
  });

  const { data: circleFollowers, isLoading: isLoadingCircleFollowers } = useQuery<AiFollower[]>({
    queryKey: [`/api/circles/${circle.id}/followers`],
  });

  // Reset pending changes when circle followers data is refreshed
  useEffect(() => {
    if (activeTab === "followers" && circleFollowers) {
      setPendingFollowerChanges({});
    }
  }, [activeTab, circleFollowers]);

  const addFollowerMutation = useMutation({
    mutationFn: async (aiFollowerId: number) => {
      // Optimistically update UI
      setPendingFollowerChanges(prev => ({ ...prev, [aiFollowerId]: "add" }));
      try {
        return await apiRequest(`/api/circles/${circle.id}/followers`, "POST", { aiFollowerId });
      } catch (error) {
        console.error("Error in addFollowerMutation:", error);
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
      setPendingFollowerChanges(prev => {
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
      setPendingFollowerChanges(prev => ({ ...prev, [followerId]: "remove" }));
      try {
        await apiRequest(`/api/circles/${circle.id}/followers/${followerId}`, "DELETE");
        return { success: true };
      } catch (error) {
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
      setPendingFollowerChanges(prev => {
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

  // =============== COLLECTIVES MANAGEMENT ===============
  // Track pending collective operations locally
  const [pendingCollectiveChanges, setPendingCollectiveChanges] = useState<Record<number, "add" | "remove">>({});

  const { data: collectives } = useQuery<AiFollowerCollective[]>({
    queryKey: ["/api/followers/collectives"],
  });

  const { data: circleCollectives, isLoading: isLoadingCircleCollectives } = useQuery<AiFollowerCollective[]>({
    queryKey: [`/api/circles/${circle.id}/collectives`],
    enabled: activeTab === "collectives",
  });

  // Reset pending changes when circle collectives data is refreshed
  useEffect(() => {
    if (activeTab === "collectives" && circleCollectives) {
      setPendingCollectiveChanges({});
    }
  }, [activeTab, circleCollectives]);

  const addCollectiveMutation = useMutation({
    mutationFn: async (collectiveId: number) => {
      // Optimistically update UI
      setPendingCollectiveChanges(prev => ({ ...prev, [collectiveId]: "add" }));
      try {
        return await apiRequest(`/api/circles/${circle.id}/collectives`, "POST", { collectiveId });
      } catch (error) {
        console.error("Error in addCollectiveMutation:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/collectives`] });
      toast({
        title: "Collective added",
        description: "The collective has been added to the circle.",
      });
    },
    onError: (error, collectiveId) => {
      console.error("Error adding collective:", error);
      // Remove the pending change on error
      setPendingCollectiveChanges(prev => {
        const updated = { ...prev };
        delete updated[collectiveId as number];
        return updated;
      });
      toast({
        title: "Error",
        description: "Failed to add collective to the circle.",
        variant: "destructive",
      });
    }
  });

  const removeCollectiveMutation = useMutation({
    mutationFn: async (collectiveId: number) => {
      // Optimistically update UI
      setPendingCollectiveChanges(prev => ({ ...prev, [collectiveId]: "remove" }));
      try {
        await apiRequest(`/api/circles/${circle.id}/collectives/${collectiveId}`, "DELETE");
        return { success: true };
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circle.id}/collectives`] });
      toast({
        title: "Collective removed",
        description: "The collective has been removed from the circle.",
      });
    },
    onError: (error, collectiveId) => {
      console.error("Error removing collective:", error);
      // Remove the pending change on error
      setPendingCollectiveChanges(prev => {
        const updated = { ...prev };
        delete updated[collectiveId as number];
        return updated;
      });
      toast({
        title: "Error",
        description: "Failed to remove collective from the circle.",
        variant: "destructive",
      });
    }
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" title="Manage AI Followers & Collectives">
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage AI Entities</DialogTitle>
          <DialogDescription>
            Add or remove AI followers and collectives for {circle.name}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs 
          defaultValue="followers" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="followers">AI Followers</TabsTrigger>
            <TabsTrigger value="collectives">Collectives</TabsTrigger>
          </TabsList>
          
          {/* AI Followers Tab Content */}
          <TabsContent value="followers" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingCircleFollowers ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !Array.isArray(followers) || followers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
                  <UserPlus className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    No AI followers available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {followers.map((follower) => {
                    // Check for pending changes first
                    const pendingChange = pendingFollowerChanges[follower.id];
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
          </TabsContent>
          
          {/* Collectives Tab Content */}
          <TabsContent value="collectives" className="mt-4">
            <ScrollArea className="h-[300px] pr-4">
              {isLoadingCircleCollectives ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !Array.isArray(collectives) || collectives.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-4 p-4">
                  <UserPlus className="h-12 w-12 text-muted-foreground" />
                  <p className="text-center text-muted-foreground">
                    No collectives available.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collectives.map((collective) => {
                    // Check for pending changes first
                    const pendingChange = pendingCollectiveChanges[collective.id];
                    // Calculate real state considering both server data and pending changes
                    const isInCircleFromServer = circleCollectives?.some(c => c.id === collective.id);
                    const isInCircle = pendingChange === "add" ? true : 
                                      pendingChange === "remove" ? false : 
                                      isInCircleFromServer;
                    
                    const isPending = addCollectiveMutation.isPending || removeCollectiveMutation.isPending;
                    
                    return (
                      <div
                        key={collective.id}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                      >
                        <div className="flex items-start flex-col">
                          <p className="font-medium">{collective.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {collective.description || collective.personality || 'No description'}
                          </p>
                        </div>
                        <Button
                          variant={isInCircle ? "destructive" : "secondary"}
                          size="sm"
                          onClick={() => {
                            if (isInCircle) {
                              removeCollectiveMutation.mutate(collective.id);
                            } else {
                              addCollectiveMutation.mutate(collective.id);
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
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}