import React from "react";
import { Circle } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CheckCircle2, Beaker, TestTube, Eye } from "lucide-react";

interface LabCircleRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labId: number;
  circle: Circle;
  currentRole: "control" | "treatment" | "observation";
  onRoleUpdateSuccess: () => void;
}

const roleInfo = {
  control: {
    icon: <CheckCircle2 className="h-5 w-5 text-blue-500" />,
    title: "Control Group",
    description: "The baseline for comparison. No experimental content will be shown."
  },
  treatment: {
    icon: <TestTube className="h-5 w-5 text-green-500" />,
    title: "Treatment Group",
    description: "Receives the experimental content or intervention being tested."
  },
  observation: {
    icon: <Eye className="h-5 w-5 text-purple-500" />,
    title: "Observation Group",
    description: "Monitors the experiment but doesn't participate directly in testing."
  }
};

export function LabCircleRoleDialog({
  open,
  onOpenChange,
  labId,
  circle,
  currentRole,
  onRoleUpdateSuccess,
}: LabCircleRoleDialogProps) {
  const { toast } = useToast();
  const [role, setRole] = React.useState<"control" | "treatment" | "observation">(currentRole);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset role when dialog opens
  React.useEffect(() => {
    if (open) {
      setRole(currentRole);
    }
  }, [open, currentRole]);

  const handleUpdateRole = async () => {
    if (role === currentRole) {
      toast({
        title: "No change needed",
        description: `Circle already has the ${role} role.`,
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest(`/api/labs/${labId}/circles/${circle.id}`, "PATCH", { role });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/labs', labId, 'circles'] });
      
      toast({
        title: "Role updated",
        description: `Circle role changed to ${role}.`,
      });
      
      onRoleUpdateSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating circle role:", error);
      toast({
        title: "Failed to update role",
        description: "There was an error updating the circle role. Please try again.",
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
            <Beaker className="h-5 w-5" />
            Update Circle Role
          </DialogTitle>
          <DialogDescription>
            Change how this circle participates in the lab experiment.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="mb-4">
            <h4 className="text-sm font-medium">Circle: {circle.name}</h4>
            <p className="text-sm text-muted-foreground">{circle.description || "No description"}</p>
          </div>

          <div className="space-y-4">
            <Label>Select Role</Label>
            <RadioGroup value={role} onValueChange={(value) => setRole(value as "control" | "treatment" | "observation")}>
              {Object.entries(roleInfo).map(([key, info]) => (
                <div key={key} className="flex items-start space-x-2 border rounded-md p-3 hover:bg-accent">
                  <RadioGroupItem value={key} id={key} className="mt-1" />
                  <Label htmlFor={key} className="font-normal flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 font-medium">
                      {info.icon}
                      {info.title}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {info.description}
                    </p>
                  </Label>
                </div>
              ))}
            </RadioGroup>
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
            onClick={handleUpdateRole}
            disabled={isSubmitting || role === currentRole}
          >
            {isSubmitting ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LabCircleRoleDialog;