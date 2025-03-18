import { Circle } from "@shared/schema";
import { useState } from "react";
import { Share2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface CircleShareDialogProps {
  circle: Circle;
}

export function CircleShareDialog({ circle }: CircleShareDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [inviteeUsername, setInviteeUsername] = useState("");
  const [selectedRole, setSelectedRole] = useState<"viewer" | "collaborator">("viewer");

  const createInvitationMutation = useMutation({
    mutationFn: async ({ username, role }: { username: string; role: "viewer" | "collaborator" }) => {
      const res = await apiRequest("POST", `/api/circles/${circle.id}/invitations`, { username, role });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/circles/invitations"] });
      toast({
        title: "Invitation sent",
        description: "The user will be notified of your invitation.",
      });
      setInviteeUsername("");
    },
    onError: (error: any) => {
      toast({
        title: "Error sending invitation",
        description: error.message || "Could not send invitation. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <Share2 className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Share Circle</SheetTitle>
          <SheetDescription>
            Invite others to join {circle.name}
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createInvitationMutation.mutate({
                username: inviteeUsername,
                role: selectedRole,
              });
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={inviteeUsername}
                onChange={(e) => setInviteeUsername(e.target.value)}
                placeholder="Enter username to invite"
              />
            </div>
            <div className="space-y-2">
              <Label>Permission Level</Label>
              <RadioGroup
                value={selectedRole}
                onValueChange={(value) =>
                  setSelectedRole(value as "viewer" | "collaborator")
                }
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="viewer" id="viewer" />
                  <Label htmlFor="viewer">Viewer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="collaborator" id="collaborator" />
                  <Label htmlFor="collaborator">Collaborator</Label>
                </div>
              </RadioGroup>
            </div>
            <Button
              type="submit"
              disabled={createInvitationMutation.isPending}
              className="w-full"
            >
              {createInvitationMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                "Send Invitation"
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}
