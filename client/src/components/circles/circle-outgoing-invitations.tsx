import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRevokeInvitation, useResendInvitation } from "@/lib/mutations/circle-mutations";

interface CircleOutgoingInvitationsProps {
  circleId: number;
}

interface OutgoingInvitation {
  id: number;
  inviteeId: number;
  status: "pending";
  role: "viewer" | "collaborator";
  createdAt: string;
  invitee: {
    id: number;
    username: string;
  } | null;
}

export function CircleOutgoingInvitations({ circleId }: CircleOutgoingInvitationsProps) {
  const { data: invitations } = useQuery<OutgoingInvitation[]>({
    queryKey: [`/api/circles/${circleId}/invitations/outgoing`],
    enabled: !!circleId,
  });

  const revokeInvitationMutation = useRevokeInvitation();
  const resendInvitationMutation = useResendInvitation();

  if (!invitations?.length) {
    return (
      <div className="text-sm text-muted-foreground text-center py-4">
        No pending invitations
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium">Pending Invitations</h3>
      <div className="space-y-2">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="flex items-center justify-between p-2 border rounded"
          >
            <div>
              <p className="font-medium">
                {invitation.invitee?.username || "Unknown User"}
              </p>
              <p className="text-sm text-muted-foreground">
                Invited as {invitation.role},{" "}
                {formatDistanceToNow(new Date(invitation.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => resendInvitationMutation.mutate(invitation.id)}
                disabled={resendInvitationMutation.isPending}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => revokeInvitationMutation.mutate(invitation.id)}
                disabled={revokeInvitationMutation.isPending}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
