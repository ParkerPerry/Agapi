import { User, CircleMember, AiFollower } from "@shared/schema";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CircleMemberWithUser = CircleMember & {
  user?: User;
};

export function CircleOwner({ owner }: { owner: User }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Owner</h3>
      <div className="flex items-center space-x-3">
        <Avatar>
          <AvatarFallback>{owner.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{owner.username}</p>
        </div>
      </div>
    </div>
  );
}

export function CircleMembers({ members }: { members: CircleMemberWithUser[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">Members</h3>
      <div className="space-y-2">
        {members.map((member) => (
          <div key={member.userId} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback>
                  {member.user?.username.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{member.user?.username || 'Unknown User'}</p>
              </div>
            </div>
            <Badge variant={member.role === "collaborator" ? "default" : "secondary"}>
              {member.role}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CircleFollowers({ followers }: { followers: AiFollower[] }) {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium">AI Followers</h3>
      <div className="space-y-2">
        {followers.map((follower) => (
          <div key={follower.id} className="flex items-center space-x-3">
            <Avatar>
              <img src={follower.avatarUrl} alt={follower.name} />
              <AvatarFallback>{follower.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{follower.name}</p>
              <p className="text-sm text-muted-foreground">{follower.personality}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}