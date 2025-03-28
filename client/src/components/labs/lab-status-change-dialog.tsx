import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

interface LabStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labId: number;
  currentStatus: string;
  newStatus: "draft" | "active" | "completed" | "archived";
  onStatusChangeSuccess: () => void;
}

const statusMessages = {
  draft: {
    title: "Change lab status to Draft",
    description: "This will set the lab as a draft. You can continue editing the lab configuration.",
    confirmText: "Set as Draft",
    icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />,
  },
  active: {
    title: "Activate this lab?",
    description: "This will activate the lab and start collecting results. Make sure you've configured everything correctly.",
    confirmText: "Activate Lab",
    icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
  },
  completed: {
    title: "Mark lab as completed?",
    description: "This will mark the lab as completed and finalize all results. You won't be able to add more data after this.",
    confirmText: "Complete Lab",
    icon: <CheckCircle2 className="h-5 w-5 text-orange-500" />,
  },
  archived: {
    title: "Archive this lab?",
    description: "This will archive the lab. You can still view results but no further changes will be allowed.",
    confirmText: "Archive Lab",
    icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
  },
};

export function LabStatusChangeDialog({
  open,
  onOpenChange,
  labId,
  currentStatus,
  newStatus,
  onStatusChangeSuccess,
}: LabStatusChangeDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const message = statusMessages[newStatus];

  const handleConfirm = async () => {
    if (currentStatus === newStatus) {
      toast({
        title: "No change needed",
        description: `Lab is already in ${newStatus} status.`,
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest(`/api/labs/${labId}/status`, "PATCH", { status: newStatus });
      
      // Invalidate lab queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/labs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/labs', labId] });
      
      toast({
        title: "Status updated",
        description: `Lab status changed to ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}.`,
      });
      
      onStatusChangeSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating lab status:", error);
      toast({
        title: "Failed to update status",
        description: "There was an error updating the lab status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {message.icon}
            {message.title}
          </DialogTitle>
          <DialogDescription>{message.description}</DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex gap-2">
          {newStatus === "active" && currentStatus === "draft" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              <p className="font-medium">Before activating:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Make sure you've added all necessary circles</li>
                <li>Defined success metrics for your experiment</li>
                <li>Set appropriate roles for all circles</li>
              </ul>
            </div>
          )}
          
          {newStatus === "completed" && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-sm text-amber-800">
              <p className="font-medium">This action will:</p>
              <ul className="list-disc list-inside mt-1">
                <li>Finalize all data collection</li>
                <li>Generate final analysis reports</li>
                <li>Prevent new content from being added</li>
              </ul>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={newStatus === "archived" ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Updating..." : message.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LabStatusChangeDialog;