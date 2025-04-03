import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Circle, CircleMember, AiFollower, User, CircleInvitation, AiFollowerCollective } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Share2, ChevronRight, Pencil, UserPlus, UserMinus, Settings, PlusCircle, PowerOff, Mail, VolumeX, Volume2, Lock as LockIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CircleEditDialog } from "@/components/circles/circle-edit-dialog";
import { CircleShareDialog } from "@/components/circles/circle-share-dialog";
import { CircleFollowerManager } from "@/components/circles/circle-follower-manager";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

interface CircleDetails {
  circle: Circle;
  owner: User;
  members: (CircleMember & { username: string })[];
  followers: (AiFollower & { muted?: boolean })[];
}

interface CirclePanelProps {
  circleId: number;
  isCollapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
}

export function CirclePanel({ circleId, isCollapsed, onCollapse }: CirclePanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch circle details
  const { data: circleDetails } = useQuery<CircleDetails>({
    queryKey: [`/api/circles/${circleId}/details`],
    enabled: !!circleId,
  });
  
  // Fetch pending invitations
  const { data: pendingInvitations } = useQuery<CircleInvitation[]>({
    queryKey: [`/api/circles/${circleId}/invitations`],
    enabled: !!circleId,
  });
  
  // Removed toggle follower active mutation as it was confusing with mute functionality
  
  // Mutation for toggling follower mute status within this circle
  const toggleMuteFollowerMutation = useMutation({
    mutationFn: async (followerId: number) => {
      const res = await apiRequest(`/api/circles/${circleId}/followers/${followerId}/toggle-mute`, "PATCH");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circleId}/followers`] });
      queryClient.invalidateQueries({ queryKey: [`/api/circles/${circleId}/details`] });
      toast({
        title: "Follower mute toggled",
        description: "The AI follower's mute status has been updated in this circle.",
      });
    },
  });

  if (!circleDetails) return null;

  const { circle, owner, members, followers } = circleDetails;
  const isOwner = user?.id === owner.id;

  // Group followers by their owners (userId)
  const followersByOwner = followers.reduce((groups, follower) => {
    // Only process followers with a valid userId (non-null)
    if (typeof follower.userId === 'number') {
      const ownerGroups = groups.get(follower.userId) || [];
      groups.set(follower.userId, [...ownerGroups, follower]);
    }
    return groups;
  }, new Map<number, (AiFollower & { muted?: boolean })[]>());

  return (
    <div className={cn(
      "h-[calc(100vh-4rem)] flex flex-col relative transition-all duration-300 border-r shadow-sm bg-card",
      isCollapsed ? "w-14" : "w-72"
    )}>
      {/* The toggle button should always be visible, regardless of panel state */}
      <div className={cn(
        "absolute top-0 right-0 h-10 flex items-center",
        isCollapsed ? "w-full justify-end pr-1" : "pr-1" 
      )}>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 rounded-full flex items-center justify-center hover:bg-muted"
          onClick={() => onCollapse(!isCollapsed)}
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform",
            !isCollapsed && "rotate-180"
          )} />
        </Button>
      </div>

      {/* Expanded content - hidden when collapsed */}
      <div className={cn(
        "transition-opacity duration-300",
        isCollapsed && "opacity-0 invisible h-0 overflow-hidden"
      )}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="relative">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                  style={{ backgroundColor: circle.color + "20" }}
                >
                  {circle.icon}
                  {circle.visibility === "private" && (
                    <div className="absolute bottom-0 right-0 bg-background rounded-full p-0.5 shadow-sm">
                      <LockIcon className="h-3 w-3" />
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold">{circle.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Created by {owner.username}
                </p>
                <div className="mt-1">
                  <Badge 
                    variant={circle.visibility === "shared" ? "secondary" : "outline"} 
                    className="text-xs py-0 h-5 text-muted-foreground"
                  >
                    {circle.visibility}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Circle actions */}
            {isOwner && (
              <div className="flex space-x-1">
                <CircleEditDialog 
                  circle={circle}
                  onEdit={(updatedCircle) => {
                    queryClient.invalidateQueries({ queryKey: [`/api/circles/${circleId}/details`] });
                  }} 
                />
                {!circle.isDefault && circle.visibility === "private" && (
                  <CircleShareDialog circle={circle} />
                )}
              </div>
            )}
          </div>
          {circle.description && (
            <p className="text-sm text-muted-foreground mt-2">
              {circle.description}
            </p>
          )}
        </div>

        <div className="p-4 flex-1 overflow-hidden">
          <ScrollArea className="h-full pr-4">
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4" />
                    Members ({members.length})
                  </h3>
                  
                  {/* Add member button for circle owner */}
                  {isOwner && !circle.isDefault && (
                    <CircleShareDialog circle={circle} />
                  )}
                </div>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarFallback>
                            {member.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {member.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {member.role}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Pending Invitations Section */}
              {pendingInvitations && pendingInvitations.length > 0 && isOwner && (
                <>
                  <div className="mt-4">
                    <h3 className="flex items-center gap-2 font-medium mb-3 text-sm">
                      <Mail className="h-4 w-4" />
                      Pending Invitations ({pendingInvitations.length})
                    </h3>
                    <div className="space-y-2">
                      {pendingInvitations.map((invitation) => (
                        <div
                          key={invitation.id}
                          className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center space-x-2">
                            <Avatar>
                              <AvatarFallback>
                                {invitation.inviteeId.toString().charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">
                                  User #{invitation.inviteeId}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {invitation.role}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Pending invitation
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <Separator className="my-4"/>
                </>
              )}
              
              <Separator />

              {/* AI Followers Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Share2 className="h-4 w-4" />
                    AI Followers ({followers.length})
                  </h3>
                  
                  {/* Add follower button */}
                  {isOwner && (
                    <CircleFollowerManager circle={circle} />
                  )}
                </div>
                
                <div className="space-y-4 pr-2">
                  {Array.from(followersByOwner.entries()).map(([userId, userFollowers]) => {
                    const ownerMember = members.find(m => m.userId === userId);
                    const ownerName = ownerMember?.username || "Unknown User";
                    const isCurrentUser = userId === user?.id;

                    return (
                      <div key={`follower-owner-${userId}`} className="space-y-2">
                        <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-card py-1 z-10">
                          {ownerName}'s AI Followers
                        </h4>
                        {userFollowers.map((follower) => (
                          <div
                            key={follower.id}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                          >
                            <div className="flex items-center space-x-2">
                              <Avatar>
                                <img src={follower.avatarUrl} alt={follower.name} />
                                <AvatarFallback>
                                  {follower.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{follower.name}</p>
                                  {!follower.active && (
                                    <Badge variant="secondary" className="text-xs">Inactive</Badge>
                                  )}
                                  {follower.muted && (
                                    <Badge variant="outline" className="text-xs border-amber-500 text-amber-500">Muted</Badge>
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {follower.personality}
                                </p>
                              </div>
                            </div>
                            
                            {/* Action buttons for followers */}
                            <div className="flex space-x-1">
                              {/* Mute/unmute button for any follower in the circle */}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                title={follower.muted ? "Unmute follower in this circle" : "Mute follower in this circle"}
                                onClick={() => toggleMuteFollowerMutation.mutate(follower.id)}
                                disabled={toggleMuteFollowerMutation.isPending}
                              >
                                {follower.muted ? (
                                  <VolumeX className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <Volume2 className="h-3 w-3 text-muted-foreground" />
                                )}
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Separator className="my-4" />
              
              {/* AI Collectives Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4" />
                    Collectives
                  </h3>
                  
                  {/* The same CircleFollowerManager is used for both followers and collectives */}
                  {isOwner && (
                    <CircleFollowerManager circle={circle} />
                  )}
                </div>
                
                {/* Render CollectivesSection in the same pattern as AI Followers section */}
                <div className="mb-2">
                  <CollectivesSection circleId={circle.id} isOwner={isOwner} members={members} />
                </div>
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Collapsed state content */}
      {isCollapsed && (
        <div className="flex items-center justify-center py-4 mt-6">
          <div className="relative">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-full text-lg"
              style={{ backgroundColor: circle.color + "20" }}
            >
              {circle.icon}
              {circle.visibility === "private" && (
                <div className="absolute bottom-0 right-0 bg-background rounded-full p-0.5 shadow-sm">
                  <LockIcon className="h-2.5 w-2.5" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface CollectivesSectionProps {
  circleId: number;
  isOwner: boolean;
  members: (CircleMember & { username: string })[];
}

function CollectivesSection({ circleId, isOwner, members }: CollectivesSectionProps) {
  // Use a custom fetch hook for collectives data
  const { data: circleCollectives, isLoading: isLoadingCollectives } = useQuery<AiFollowerCollective[]>({
    queryKey: [`/api/circles/${circleId}/collectives`],
  });
  
  if (isLoadingCollectives) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  if (!circleCollectives || circleCollectives.length === 0) {
    return (
      <div className="text-sm text-muted-foreground py-4 text-center">
        No collectives added to this circle yet.
        {isOwner && (
          <div className="mt-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs"
              onClick={() => {
                // Find any CircleFollowerManager button and simulate a click
                const managerButton = document.querySelector('[title="Manage AI Followers & Collectives"]');
                if (managerButton) {
                  (managerButton as HTMLButtonElement).click();
                }
              }}
            >
              Add collectives
            </Button>
          </div>
        )}
      </div>
    );
  }
  
  // Group collectives by owner (similar to followers)
  const collectivesByOwner = new Map<number, AiFollowerCollective[]>();
  circleCollectives.forEach(collective => {
    const ownerId = collective.userId;
    if (!collectivesByOwner.has(ownerId)) {
      collectivesByOwner.set(ownerId, []);
    }
    collectivesByOwner.get(ownerId)?.push(collective);
  });
  
  return (
    <div className="space-y-4 pr-2">
      {Array.from(collectivesByOwner.entries()).map(([userId, userCollectives]) => {
        const ownerMember = members.find(m => m.userId === userId);
        const ownerName = ownerMember?.username || "Unknown User";
        
        return (
          <div key={`collective-${userId}`} className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground sticky top-0 bg-card py-1 z-10">
              {ownerName}'s Collectives
            </h4>
            {userCollectives.map((collective) => (
              <div
                key={`collective-${collective.id}`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
              >
                <div className="flex items-start flex-col">
                  <p className="text-sm font-medium">{collective.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {collective.description || collective.personality || 'No description'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}