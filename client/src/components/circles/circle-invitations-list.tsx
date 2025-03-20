import { Circle, CircleInvitation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRespondToInvitation } from "@/lib/mutations/circle-mutations";
import { Users, Share2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CircleDetailsDialog } from "./circle-details-dialog";
import { useQuery } from "@tanstack/react-query";

interface CircleInvitationsListProps {
  invitations: (CircleInvitation & { circle: Circle })[];
}

export function CircleInvitationsList({ invitations }: CircleInvitationsListProps) {
  const respondToInvitationMutation = useRespondToInvitation();

  if (!invitations.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Circle Invitations</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {invitations.map((invitation) => {
            // Fetch circle details including members and followers
            const { data: details } = useQuery({
              queryKey: [`/api/circles/${invitation.circle.id}/details`],
              enabled: !!invitation.circle.id,
            });

            return (
              <div
                key={invitation.id}
                className="flex flex-col gap-4 p-4 border rounded-lg"
                style={{ borderColor: invitation.circle.color }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div
                      className="flex items-center justify-center w-10 h-10 rounded-full text-xl"
                      style={{ backgroundColor: invitation.circle.color + "20" }}
                    >
                      {invitation.circle.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{invitation.circle.name}</h3>
                        <Badge
                          variant={invitation.circle.visibility === "shared" ? "default" : "outline"}
                        >
                          {invitation.circle.visibility}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You've been invited as a {invitation.role}
                      </p>
                      {invitation.circle.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {invitation.circle.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <CircleDetailsDialog circleId={invitation.circle.id} />
                    <Button
                      variant="default"
                      onClick={() =>
                        respondToInvitationMutation.mutate({
                          invitationId: invitation.id,
                          status: "accepted",
                        })
                      }
                      disabled={respondToInvitationMutation.isPending}
                    >
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        respondToInvitationMutation.mutate({
                          invitationId: invitation.id,
                          status: "declined",
                        })
                      }
                      disabled={respondToInvitationMutation.isPending}
                    >
                      Decline
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{details?.members?.length || 0} Members</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Share2 className="h-4 w-4" />
                    <span>{details?.followers?.length || 0} AI Followers</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}