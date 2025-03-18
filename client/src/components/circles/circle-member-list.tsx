import { useState } from "react";
import { User } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useDeactivateCircleMember, useReactivateCircleMember } from "@/lib/mutations/circle-mutations";

interface CircleMemberListProps {
  members: {
    id: number;
    userId: number;
    username: string;
    role: string;
    status: string;
  }[];
  circleId: number;
  isOwner: boolean;
}

export function CircleMemberList({ members, circleId, isOwner }: CircleMemberListProps) {
  const deactivateMember = useDeactivateCircleMember();
  const reactivateMember = useReactivateCircleMember();
  
  return (
    <div className="space-y-2">
      {members.map((member) => (
        <div
          key={member.id}
          className="flex items-center justify-between p-2 rounded-lg hover:bg-muted group"
        >
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{member.username}</p>
              <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
            </div>
          </div>

          {isOwner && member.role !== "owner" && (
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              {member.status === "active" ? (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Deactivate
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Deactivate Member</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to deactivate {member.username} from this circle?
                        They will lose access to all circle content.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => 
                          deactivateMember.mutate({ 
                            circleId, 
                            userId: member.userId 
                          })
                        }
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Deactivate
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => 
                    reactivateMember.mutate({ 
                      circleId, 
                      userId: member.userId 
                    })
                  }
                >
                  Reactivate
                </Button>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
