import React, { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, AlertTriangle, Info, CheckCircle, PlayCircle, Archive } from "lucide-react";

interface LabStatusChangeDialogProps {
  labId: number;
  currentStatus: string;
  newStatus: "draft" | "active" | "completed" | "archived";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

/**
 * Dialog for confirming lab status changes
 * Displays different messages and icons depending on the status transition
 */
const LabStatusChangeDialog = ({
  labId,
  currentStatus,
  newStatus,
  open,
  onOpenChange,
  onSuccess,
}: LabStatusChangeDialogProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateStatus = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/labs/${labId}/status`, "PATCH", { status: newStatus });
      
      toast({
        title: "Status updated",
        description: `Lab status changed to ${newStatus}.`,
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Failed to update status",
        description: "There was an error updating the lab status.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusIcon = () => {
    switch (newStatus) {
      case "active":
        return <PlayCircle className="h-6 w-6 text-green-500" />;
      case "completed":
        return <CheckCircle className="h-6 w-6 text-blue-500" />;
      case "archived":
        return <Archive className="h-6 w-6 text-gray-500" />;
      default:
        return <Info className="h-6 w-6 text-amber-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (newStatus) {
      case "active":
        return "This will activate the lab and start collecting metrics. Any treatment groups will receive the experimental content.";
      case "completed":
        return "This will mark the lab as completed. You'll still be able to view the results, but no new data will be collected.";
      case "archived":
        return "This will archive the lab. It will no longer appear in the main lab list by default, but can still be accessed in archived view.";
      default:
        return "Are you sure you want to change the status of this lab?";
    }
  };

  const getDialogTitle = () => {
    switch (newStatus) {
      case "active":
        return "Activate Lab";
      case "completed":
        return "Complete Lab";
      case "archived":
        return "Archive Lab";
      default:
        return "Change Lab Status";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            {getDialogTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStatusMessage()}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 flex justify-center">
          <div className="p-3 bg-muted rounded-full">
            {currentStatus === "draft" && newStatus === "active" && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">Draft</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">Active</span>
              </div>
            )}
            {newStatus === "completed" && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">{currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">Completed</span>
              </div>
            )}
            {newStatus === "archived" && (
              <div className="flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">{currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">Archived</span>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={isSubmitting}
            variant={newStatus === "archived" ? "destructive" : "default"}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabStatusChangeDialog;