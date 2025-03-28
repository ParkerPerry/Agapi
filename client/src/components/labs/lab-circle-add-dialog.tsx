import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Circle } from "@shared/schema";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Users } from "lucide-react";

interface LabCircleAddDialogProps {
  labId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCircle: () => void;
}

const LabCircleAddDialog = ({
  labId,
  open,
  onOpenChange,
  onAddCircle,
}: LabCircleAddDialogProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<"control" | "treatment" | "observation">("treatment");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch user's circles
  const {
    data: circles,
    isLoading,
    error,
  } = useQuery<Circle[]>({
    queryKey: ["/api/circles"],
    enabled: open,
  });

  // Fetch circles already in the lab to exclude them
  const {
    data: labCircles,
  } = useQuery<(Circle & { role: string })[]>({
    queryKey: [`/api/labs/${labId}/circles`],
    enabled: open && !!labId,
  });

  // Filter circles that are not already in the lab
  const filteredCircles = circles?.filter(circle => {
    // Exclude circles already in the lab
    const isAlreadyInLab = labCircles?.some(
      labCircle => labCircle.id === circle.id
    );
    
    // Apply search filter
    const matchesSearch = searchQuery === "" ||
      circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (circle.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    return !isAlreadyInLab && matchesSearch;
  });

  const handleAddCircle = async () => {
    if (!selectedCircleId) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/labs/${labId}/circles`, {
        method: "POST",
        body: {
          circleId: selectedCircleId,
          role: selectedRole,
        },
      });
      
      toast({
        title: "Circle added",
        description: "Circle has been added to the lab successfully.",
      });
      
      onOpenChange(false);
      onAddCircle();
      
      // Reset selections
      setSelectedCircleId(null);
      setSelectedRole("treatment");
      setSearchQuery("");
    } catch (error) {
      toast({
        title: "Failed to add circle",
        description: "There was an error adding the circle to the lab.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCircleSelect = (circleId: number) => {
    setSelectedCircleId(circleId === selectedCircleId ? null : circleId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Add Circle to Lab</DialogTitle>
          <DialogDescription>
            Select a circle to add to this experiment lab and assign its role.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center border rounded-md px-3 py-2">
            <Search className="h-4 w-4 mr-2 text-muted-foreground" />
            <Input
              placeholder="Search circles..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="border rounded-md p-4 space-y-2">
            <h4 className="font-medium">Circle Role</h4>
            <p className="text-sm text-muted-foreground mb-2">
              Determine how this circle will be used in the experiment.
            </p>
            <RadioGroup
              value={selectedRole}
              onValueChange={(value) => setSelectedRole(value as "control" | "treatment" | "observation")}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="control" id="control" />
                <Label htmlFor="control">Control Group</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="treatment" id="treatment" />
                <Label htmlFor="treatment">Treatment Group</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="observation" id="observation" />
                <Label htmlFor="observation">Observation Only</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Available Circles</h4>
            {isLoading ? (
              <div className="text-center py-4">Loading circles...</div>
            ) : error ? (
              <div className="text-center py-4 text-destructive">
                Failed to load circles.
              </div>
            ) : filteredCircles?.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                No available circles found.
              </div>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-auto pr-1">
                {filteredCircles?.map((circle) => (
                  <Card 
                    key={circle.id} 
                    className={`cursor-pointer border-2 ${
                      selectedCircleId === circle.id 
                        ? "border-primary" 
                        : "hover:border-muted-foreground/20"
                    }`}
                    onClick={() => handleCircleSelect(circle.id)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">{circle.name}</CardTitle>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          <span>Members: {circle.memberCount || 0}</span>
                        </div>
                      </div>
                      <CardDescription className="line-clamp-2 text-xs">
                        {circle.description || "No description."}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddCircle}
            disabled={!selectedCircleId || isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Circle"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabCircleAddDialog;