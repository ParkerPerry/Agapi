import { Circle, User, CircleMember, AiFollower } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Users, Share2, Info, Clock, MailPlus } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useResendInvitation } from "@/lib/mutations/circle-mutations";
import { toast } from "@/hooks/use-toast";

interface CircleDetailsProps {
  circleId: number;
}

interface PendingInvitation {
  id: number;
  circleId: number;
  inviteeId: number;
  status: string;
  role: string;
  invitee: {
    id: number;
    username: string;
    avatar: string | null;
  } | null;
}

interface CircleDetails {
  circle: Circle;
  owner: User;
  members: (CircleMember & { username: string })[];
  followers: AiFollower[];
  pendingInvitations?: PendingInvitation[];
}

export function CircleDetailsDialog({ circleId }: CircleDetailsProps) {
  const resendInvitationMutation = useResendInvitation();

  const { data: details } = useQuery<CircleDetails>({
    queryKey: [`/api/circles/${circleId}/details`],
    enabled: !!circleId,
  });

  const { data: pendingInvitations } = useQuery<PendingInvitation[]>({
    queryKey: [`/api/circles/${circleId}/pending-invitations`],
    enabled: !!circleId,
  });

  if (!details) return null;
  const { circle, owner, members, followers } = details;

  const handleResendInvitation = async (invitationId: number) => {
    try {
      await resendInvitationMutation.mutateAsync(invitationId);
      toast({
        title: "Success",
        description: "Invitation has been resent",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend invitation",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Info className="h-4 w-4 mr-2" />
          Circle Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Circle Information</DialogTitle>
          <DialogDescription>
            View detailed information about this circle
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1">
          <div className="space-y-6 p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                  style={{ backgroundColor: circle.color + "20" }}
                >
                  {circle.icon}
                </div>
                <div>
                  <h3 className="font-medium">{circle.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Created by {owner.username}
                  </p>
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
            </div>

            {pendingInvitations && pendingInvitations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Pending Invitations ({pendingInvitations.length})
                </h4>
                <div className="space-y-2">
                  {pendingInvitations.map((invitation) => (
                    <div
                      key={invitation.id}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-muted"
                    >
                      <div className="flex items-center space-x-2">
                        <Avatar>
                          <AvatarFallback>
                            {invitation.invitee?.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">
                            {invitation.invitee?.username}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Invited as {invitation.role}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvitation(invitation.id)}
                        disabled={resendInvitationMutation.isPending}
                      >
                        <MailPlus className="h-4 w-4 mr-2" />
                        Resend
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Members ({members.length})
              </h4>
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

            <div>
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Share2 className="h-4 w-4" />
                AI Followers ({followers.length})
              </h4>
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
      </DialogContent>
    </Dialog>
  );
}