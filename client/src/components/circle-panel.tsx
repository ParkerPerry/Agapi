import { useQuery } from "@tanstack/react-query";
import { Circle, CircleMember, AiFollower, User } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Users, Share2, Settings } from "lucide-react";

interface CirclePanelProps {
  circleId: number;
}

export function CirclePanel({ circleId }: CirclePanelProps) {
  const { data: circleDetails } = useQuery({
    queryKey: [`/api/circles/${circleId}/details`],
    enabled: !!circleId,
  });

  if (!circleDetails) return null;

  const { circle, owner, members, followers } = circleDetails;

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
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar>
                        <AvatarFallback>
                          {member.userId === owner.id ? "O" : "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {member.userId === owner.id ? owner.username : "Member"}
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

            <Separator />

            <div>
              <h3 className="flex items-center gap-2 font-medium mb-3">
                <Share2 className="h-4 w-4" />
                AI Followers ({followers.length})
              </h3>
              <div className="space-y-2">
                {followers.map((follower) => (
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
                        <p className="text-sm font-medium">{follower.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {follower.personality}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
