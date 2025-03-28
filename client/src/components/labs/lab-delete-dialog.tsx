import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lab } from "@shared/schema";

interface LabDeleteDialogProps {
  lab: Lab;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
}

const LabDeleteDialog = ({
  lab,
  open,
  onOpenChange,
  onDelete,
}: LabDeleteDialogProps) => {
  const { toast } = useToast();
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const expectedConfirmation = lab.name;

  const handleDelete = async () => {
    if (confirmText !== expectedConfirmation) return;

    setIsDeleting(true);
    try {
      await apiRequest(`/api/labs/${lab.id}`, {
        method: "DELETE",
      });
      
      toast({
        title: "Lab deleted",
        description: "The lab has been deleted successfully.",
      });
      
      onOpenChange(false);
      onDelete();
    } catch (error) {
      toast({
        title: "Failed to delete lab",
        description: "There was an error deleting the lab.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isConfirmationValid = confirmText === expectedConfirmation;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Lab</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the lab
            and all associated data.
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 my-4">
          <p className="text-sm">
            Please type <span className="font-bold">{expectedConfirmation}</span> to confirm.
          </p>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="Type lab name to confirm"
            className="w-full"
          />
        </div>
        
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={!isConfirmationValid || isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Lab"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LabDeleteDialog;