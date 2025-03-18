import { CircleInvitation } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRespondToInvitation } from "@/lib/mutations/circle-mutations";

interface CircleInvitationsListProps {
  invitations: CircleInvitation[];
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
          {invitations.map((invitation) => (
            <div
              key={invitation.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div>
                <p className="font-medium">Circle Invitation</p>
                <p className="text-sm text-muted-foreground">
                  You've been invited as a {invitation.role}
                </p>
              </div>
              <div className="flex gap-2">
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
