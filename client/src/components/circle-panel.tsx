import { useQuery } from "@tanstack/react-query";
import { Circle, CircleMember, AiFollower, User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Users, Share2 } from "lucide-react";

interface CircleDetails {
  circle: Circle;
  owner: User;
  members: (CircleMember & { username: string })[];
  followers: AiFollower[];
}

interface CirclePanelProps {
  circleId: number;
}

// Generate a consistent color for a user based on their username
function generateUserColor(username: string): string {
  const colors = [
    "#2563eb", // blue
    "#dc2626", // red
    "#16a34a", // green
    "#9333ea", // purple
    "#ea580c", // orange
    "#0891b2", // cyan
    "#be185d", // pink
  ];
  // Simple hash function to get a consistent index
  const hash = username.split('').reduce((acc, char) => char.charCodeAt(0) + acc, 0);
  return colors[hash % colors.length];
}

export function CirclePanel({ circleId }: CirclePanelProps) {
  const { data: circleDetails } = useQuery<CircleDetails>({
    queryKey: [`/api/circles/${circleId}/details`],
    enabled: !!circleId,
  });

  if (!circleDetails) return null;

  const { circle, owner, members, followers } = circleDetails;

  // Group followers by their owners (userId)
  const followersByOwner = followers.reduce((groups, follower) => {
    const ownerMember = members.find(m => m.userId === follower.userId);
    const ownerGroups = groups.get(follower.userId) || [];
    groups.set(follower.userId, [...ownerGroups, follower]);
    return groups;
  }, new Map<number, AiFollower[]>());

  return (
    <Card className="h-[calc(100vh-4rem)] flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
              style={{ backgroundColor: circle.color + "20" }}
            >
              {circle.icon}
            </div>
            <div>
              <CardTitle>{circle.name}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Created by {owner.username}
              </p>
            </div>
          </div>
          <Badge variant={circle.visibility === "shared" ? "default" : "outline"}>
            {circle.visibility}
          </Badge>
        </div>
        {circle.description && (
          <p className="text-sm text-muted-foreground mt-2">
            {circle.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </h3>
              <div className="space-y-2">
                {members.map((member) => {
                  const userColor = generateUserColor(member.username);
                  return (
                    <div
                      key={member.userId}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center space-x-2">
                        <div className="relative">
                          <Avatar>
                            <AvatarFallback style={{ backgroundColor: userColor + "20", color: userColor }}>
                              {member.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div 
                            className="absolute inset-0 rounded-full border-2"
                            style={{ borderColor: userColor }}
                          />
                        </div>
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
                  );
                })}
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <Share2 className="h-4 w-4" />
                AI Followers ({followers.length})
              </h3>
              <div className="space-y-4">
                {Array.from(followersByOwner.entries()).map(([userId, userFollowers]) => {
                  const ownerMember = members.find(m => m.userId === userId);
                  const ownerName = ownerMember?.username || "Unknown User";
                  const userColor = generateUserColor(ownerName);

                  return (
                    <div key={userId} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: userColor }}
                        />
                        <h4 className="text-sm font-medium text-muted-foreground">
                          {ownerName}'s AI Followers
                        </h4>
                      </div>
                      {userFollowers.map((follower) => (
                        <div
                          key={follower.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                        >
                          <div className="flex items-center space-x-2">
                            <div className="relative">
                              <Avatar>
                                <img src={follower.avatarUrl} alt={follower.name} />
                                <AvatarFallback>
                                  {follower.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div 
                                className="absolute inset-0 rounded-full border-2"
                                style={{ borderColor: userColor }}
                              />
                            </div>
                            <div>
                              <p className="text-sm font-medium">
                                {follower.name}
                                <span 
                                  className="ml-2 text-xs font-normal"
                                  style={{ color: userColor }}
                                >
                                  @{ownerName}
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {follower.personality}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}