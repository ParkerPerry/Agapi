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
import { Loader2 } from "lucide-react";

interface FollowerDeleteDialogProps {
  trigger: React.ReactNode;
  follower: AiFollower;
  onDelete: (followerId: number) => void;
  isDeleting: boolean;
}

export function FollowerDeleteDialog({ trigger, follower, onDelete, isDeleting }: FollowerDeleteDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete AI Follower
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to permanently delete {follower.name}? This action cannot be undone, and all data associated with this follower will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => onDelete(follower.id)}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}