import React from "react";
// import { Circle } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, PlusCircle, UserCircle, CheckCircle2, TestTube, Eye } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LocalCircle {
  id: number;
  name: string;
  description: string | null;
  icon?: string | null;
  color?: string | null;
}

interface CirclesResponse {
  private?: LocalCircle[];
  shared?: LocalCircle[];
}

interface LabCircleAddDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  labId: number;
  onAddSuccess: () => void;
  existingCircleIds: number[];
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

export function LabCircleAddDialog({
  open,
  onOpenChange,
  labId,
  onAddSuccess,
  existingCircleIds,
}: LabCircleAddDialogProps) {
  const { toast } = useToast();
  const [selectedCircleId, setSelectedCircleId] = React.useState<number | null>(null);
  const [role, setRole] = React.useState<"control" | "treatment" | "observation">("observation");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when dialog opens
  React.useEffect(() => {
    if (open) {
      setSelectedCircleId(null);
      setRole("observation");
    }
  }, [open]);

  // Fetch circles
  const { data: circlesData, isLoading: isLoadingCircles } = useQuery<CirclesResponse>({
    queryKey: ['/api/circles'],
    enabled: open,
  });

  // Debug: log response to check format
  React.useEffect(() => {
    if (circlesData) {
      console.log("Circles data:", circlesData);
    }
  }, [circlesData]);

  // The API returns an object with "private" and "shared" keys containing arrays of circles
  // Extract all circles into a single array
  const circles = React.useMemo(() => {
    if (!circlesData) return [];
    
    const allCircles: LocalCircle[] = [];
    
    // Extract from private and shared properties
    if (circlesData.private && Array.isArray(circlesData.private)) {
      allCircles.push(...circlesData.private);
    }
    
    if (circlesData.shared && Array.isArray(circlesData.shared)) {
      allCircles.push(...circlesData.shared);
    }
    
    return allCircles;
  }, [circlesData]);

  // Filter out circles that are already in the lab
  const availableCircles = circles.filter((circle: LocalCircle) => 
    !existingCircleIds.includes(circle.id)
  );

  const handleAddCircle = async () => {
    if (!selectedCircleId) {
      toast({
        title: "No circle selected",
        description: "Please select a circle to add to the lab.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await apiRequest(`/api/labs/${labId}/circles`, "POST", { 
        circleId: selectedCircleId, 
        role 
      });
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/labs', labId, 'circles'] });
      
      toast({
        title: "Circle added",
        description: `Circle has been added to the lab with ${role} role.`,
      });
      
      onAddSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding circle to lab:", error);
      toast({
        title: "Failed to add circle",
        description: "There was an error adding the circle to the lab. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add Circle to Lab
          </DialogTitle>
          <DialogDescription>
            Select a circle to add to this lab and assign its experimental role.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
          {/* Circle Selection */}
          <div className="space-y-4">
            <Label>Select Circle</Label>
            {isLoadingCircles ? (
              <div className="flex justify-center p-4">
                <span className="text-sm text-muted-foreground">Loading circles...</span>
              </div>
            ) : availableCircles.length === 0 ? (
              <div className="border rounded-md p-4 text-center">
                <span className="text-sm text-muted-foreground">
                  No available circles to add. All your circles are already part of this lab.
                </span>
              </div>
            ) : (
              <ScrollArea className="h-[180px] border rounded-md p-2">
                <RadioGroup
                  value={selectedCircleId?.toString() || ""}
                  onValueChange={(value) => setSelectedCircleId(parseInt(value))}
                >
                  {availableCircles.map((circle: LocalCircle) => (
                    <div 
                      key={circle.id} 
                      className="flex items-start space-x-2 mb-2 p-2 hover:bg-accent rounded-md"
                    >
                      <RadioGroupItem value={circle.id.toString()} id={`circle-${circle.id}`} className="mt-1" />
                      <Label htmlFor={`circle-${circle.id}`} className="font-normal flex-1 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <UserCircle className="h-4 w-4 text-primary" />
                          <span className="font-medium">{circle.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {circle.description || "No description"}
                        </p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </ScrollArea>
            )}
          </div>

          {/* Role Selection */}
          {selectedCircleId && (
            <div className="space-y-4">
              <Label>Assign Role</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as "control" | "treatment" | "observation")}>
                {Object.entries(roleInfo).map(([key, info]) => (
                  <div key={key} className="flex items-start space-x-2 border rounded-md p-3 hover:bg-accent">
                    <RadioGroupItem value={key} id={`role-${key}`} className="mt-1" />
                    <Label htmlFor={`role-${key}`} className="font-normal flex-1 cursor-pointer">
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
          )}
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
            onClick={handleAddCircle}
            disabled={isSubmitting || !selectedCircleId}
          >
            {isSubmitting ? "Adding..." : "Add Circle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LabCircleAddDialog;