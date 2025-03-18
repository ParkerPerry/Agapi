import { AiFollower } from "@shared/schema";
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
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface FollowerDeactivateDialogProps {
  trigger: React.ReactNode;
  follower: AiFollower;
  onToggleActive: (followerId: number) => void;
  isUpdating: boolean;
}

export function FollowerDeactivateDialog({ trigger, follower, onToggleActive, isUpdating }: FollowerDeactivateDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {follower.active ? "Deactivate" : "Reactivate"} AI Follower
          </AlertDialogTitle>
          <AlertDialogDescription>
            {follower.active 
              ? `Are you sure you want to deactivate ${follower.name}? They will no longer participate in conversations, but their previous interactions will remain intact.`
              : `Would you like to reactivate ${follower.name}? They will resume participating in conversations.`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onToggleActive(follower.id)}
            className={cn(
              "bg-destructive hover:bg-destructive/90",
              !follower.active && "bg-primary hover:bg-primary/90"
            )}
          >
            {isUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : follower.active ? (
              "Deactivate"
            ) : (
              "Reactivate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
