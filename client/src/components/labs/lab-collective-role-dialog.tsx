import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Settings } from "lucide-react";

interface LabCollectiveRoleDialogProps {
  labId: number;
  collectiveId: number;
  collectiveName: string;
  currentRole: "control" | "treatment" | "observation";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const LabCollectiveRoleDialog = ({
  labId,
  collectiveId,
  collectiveName,
  currentRole,
  open,
  onOpenChange,
  onSuccess,
}: LabCollectiveRoleDialogProps) => {
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<"control" | "treatment" | "observation">(currentRole);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUpdateRole = async () => {
    if (isSubmitting || selectedRole === currentRole) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/labs/${labId}/collectives/${collectiveId}`, "PATCH", {
        role: selectedRole,
      });
      
      toast({
        title: "Role updated",
        description: `Collective "${collectiveName}" now has the role: ${selectedRole}`,
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Failed to update role",
        description: "There was an error changing the collective's role.",
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
            <Settings className="h-5 w-5" />
            Change Collective Role
          </DialogTitle>
          <DialogDescription>
            Change the role of AI collective "{collectiveName}" in this lab.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="role-select">Collective Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as "control" | "treatment" | "observation")
              }
            >
              <SelectTrigger id="role-select">
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="control">Control</SelectItem>
                <SelectItem value="treatment">Treatment</SelectItem>
                <SelectItem value="observation">Observation</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              <span className="font-medium">Control:</span> Baseline AI follower behavior<br />
              <span className="font-medium">Treatment:</span> Experimental AI follower behavior<br />
              <span className="font-medium">Observation:</span> AI followers observe but don't interact
            </p>
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
            disabled={selectedRole === currentRole || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Role"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabCollectiveRoleDialog;