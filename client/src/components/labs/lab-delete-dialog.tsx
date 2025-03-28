import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Lab } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

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
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isDeleting) return;
    
    setIsDeleting(true);
    try {
      await apiRequest(`/api/labs/${lab.id}`, "DELETE");
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Lab
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete the lab "{lab.name}"?
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-muted-foreground mb-2">
            This action cannot be undone. This will:
          </p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Delete all lab metadata and settings</li>
            <li>Remove all circle associations from this lab</li>
            <li>Delete any lab-specific metrics and results</li>
          </ul>
        </div>
        
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Lab"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabDeleteDialog;