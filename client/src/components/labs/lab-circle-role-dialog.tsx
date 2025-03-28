import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface LabCircleRoleDialogProps {
  labId: number;
  circleId: number;
  initialRole: "control" | "treatment" | "observation";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoleUpdate: () => void;
}

const LabCircleRoleDialog = ({
  labId,
  circleId,
  initialRole,
  open,
  onOpenChange,
  onRoleUpdate,
}: LabCircleRoleDialogProps) => {
  const { toast } = useToast();
  const [role, setRole] = useState<"control" | "treatment" | "observation">(initialRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRoleChange = async () => {
    if (role === initialRole) {
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest(`/api/labs/${labId}/circles/${circleId}`, {
        method: "PATCH",
        body: { role },
      });
      
      toast({
        title: "Role updated",
        description: "Circle role has been updated successfully.",
      });
      
      onOpenChange(false);
      onRoleUpdate();
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: "There was an error updating the circle role.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleDescriptions = {
    control: "Acts as a baseline for comparison. Content and interactions remain unchanged.",
    treatment: "Receives experimental interventions or changes to test your hypothesis.",
    observation: "Only observes the experiment. Not actively included in the results analysis."
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Circle Role</DialogTitle>
          <DialogDescription>
            Change the role of this circle in the experiment lab.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          <RadioGroup
            value={role}
            onValueChange={(value) => setRole(value as "control" | "treatment" | "observation")}
          >
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="control" id="control" className="mt-1" />
                <div>
                  <Label htmlFor="control" className="text-base font-medium">Control Group</Label>
                  <p className="text-sm text-muted-foreground">{roleDescriptions.control}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="treatment" id="treatment" className="mt-1" />
                <div>
                  <Label htmlFor="treatment" className="text-base font-medium">Treatment Group</Label>
                  <p className="text-sm text-muted-foreground">{roleDescriptions.treatment}</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <RadioGroupItem value="observation" id="observation" className="mt-1" />
                <div>
                  <Label htmlFor="observation" className="text-base font-medium">Observation Group</Label>
                  <p className="text-sm text-muted-foreground">{roleDescriptions.observation}</p>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRoleChange}
            disabled={role === initialRole || isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabCircleRoleDialog;