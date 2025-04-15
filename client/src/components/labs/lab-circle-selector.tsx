import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Circle } from "@shared/schema";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, PlusCircle, X, Plus } from "lucide-react";

interface CircleRole {
  id: number;
  role: "control" | "treatment" | "observation";
}

interface LabCircleSelectorProps {
  selectedCircles: CircleRole[];
  onCirclesChange: (circles: CircleRole[]) => void;
  className?: string;
}

/**
 * A reusable component for selecting and assigning roles to circles in labs.
 * This component is designed to be embedded directly in forms rather than as a dialog.
 * It's based on the functionality of LabCircleAddDialog but adapted for inline use.
 */
const LabCircleSelector: React.FC<LabCircleSelectorProps> = ({
  selectedCircles,
  onCirclesChange,
  className
}) => {
  const [isAddCircleOpen, setIsAddCircleOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<"control" | "treatment" | "observation">("treatment");

  // Reset selection state when dialog opens
  useEffect(() => {
    if (isAddCircleOpen) {
      setSelectedCircleId(null);
      setSelectedRole("treatment");
      setSearchQuery("");
    }
  }, [isAddCircleOpen]);

  // Fetch user's circles
  const {
    data: circlesData,
    isLoading: isCirclesLoading,
    error: circlesError,
  } = useQuery({
    queryKey: ["/api/circles"],
  });

  // Extract all circles from response (API returns object with 'private' and 'shared' properties)
  const circles = React.useMemo(() => {
    if (!circlesData) return [];
    
    const allCircles: Circle[] = [];
    if (circlesData && typeof circlesData === 'object') {
      if ('private' in circlesData && Array.isArray(circlesData.private)) {
        allCircles.push(...circlesData.private);
      }
      if ('shared' in circlesData && Array.isArray(circlesData.shared)) {
        allCircles.push(...circlesData.shared);
      }
    }
    return allCircles;
  }, [circlesData]);

  // Get IDs of already selected circles
  const existingCircleIds = selectedCircles.map(circle => circle.id);

  // Filter out circles that are already selected
  const availableCircles = circles?.filter(
    (circle) => !existingCircleIds.includes(circle.id)
  ) || [];

  // Filter circles by search query
  const filteredCircles = searchQuery
    ? availableCircles.filter(
        (circle) =>
          circle.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (circle.description &&
            circle.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : availableCircles;
  
  // Find the selected circle for display
  const selectedCircle = selectedCircleId 
    ? availableCircles.find(circle => circle.id === selectedCircleId) 
    : null;

  const handleAddCircle = () => {
    if (!selectedCircleId) return;
    
    // Add the circle to the selected circles list
    const newCircles = [
      ...selectedCircles,
      { id: selectedCircleId, role: selectedRole }
    ];
    onCirclesChange(newCircles);
    
    // Close the dialog
    setIsAddCircleOpen(false);
  };

  const handleRemoveCircle = (circleId: number) => {
    const newCircles = selectedCircles.filter(circle => circle.id !== circleId);
    onCirclesChange(newCircles);
  };

  // Find the corresponding complete circle object for each selected circle
  const selectedCircleData = selectedCircles
    .map(circle => {
      const fullCircle = circles?.find(c => c.id === circle.id);
      return {
        ...circle,
        name: fullCircle?.name || `Circle ${circle.id}`,
        color: fullCircle?.color
      };
    });

  const getRoleBadgeStyles = (role: "control" | "treatment" | "observation") => {
    switch (role) {
      case "control":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "treatment":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "observation":
        return "bg-purple-100 text-purple-800 border-purple-300";
      default:
        return "";
    }
  };

  return (
    <div className={className}>
      {/* Selected Circles Display */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-md">
        {selectedCircleData.length > 0 ? (
          selectedCircleData.map((circle) => (
            <div 
              key={circle.id} 
              className="flex items-center gap-1 bg-primary/10 text-primary rounded-full px-3 py-1 text-sm"
            >
              <span>{circle.name}</span>
              <Badge variant="secondary" className={`ml-1 text-xs ${getRoleBadgeStyles(circle.role)}`}>
                {circle.role === 'control' ? 'Control' : 
                 circle.role === 'treatment' ? 'Treatment' : 'Observation'}
              </Badge>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-4 w-4 rounded-full ml-1"
                onClick={() => handleRemoveCircle(circle.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))
        ) : (
          <div className="text-sm text-muted-foreground py-2 text-center w-full">
            No circles selected yet
          </div>
        )}
      </div>
      
      {/* Add Circle Button */}
      <Button 
        type="button" 
        variant="outline" 
        size="sm" 
        className="w-full mt-2"
        disabled={isCirclesLoading || availableCircles.length === 0}
        onClick={() => setIsAddCircleOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Circle
      </Button>
      
      {/* Add Circle Dialog */}
      <Dialog open={isAddCircleOpen} onOpenChange={setIsAddCircleOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5" />
              Add Circle to Lab
            </DialogTitle>
            <DialogDescription>
              Select a circle to add to your experiment lab and assign a role.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="circle-select">Select Circle</Label>
              {isCirclesLoading ? (
                <div className="flex items-center justify-center h-[200px]">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : circlesError ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-destructive">Failed to load circles.</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4"
                    onClick={() => window.location.reload()}
                  >
                    Retry
                  </Button>
                </div>
              ) : availableCircles.length === 0 ? (
                <div className="text-center py-8 border rounded-md">
                  <p className="text-muted-foreground">
                    No available circles to add to this lab.
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    All your circles are already part of this lab or you don't have any circles yet.
                  </p>
                </div>
              ) : selectedCircle ? (
                // Show selected circle
                <div className="rounded-lg border shadow-md p-3 flex items-start gap-2">
                  <div
                    className="w-3 h-3 mt-1 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: selectedCircle.color || "#c5c5c5",
                    }}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{selectedCircle.name}</div>
                    {selectedCircle.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {selectedCircle.description}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">
                      Visibility: {selectedCircle.visibility}
                    </div>
                    <Button 
                      type="button"
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs"
                      onClick={() => setSelectedCircleId(null)}
                    >
                      Change
                    </Button>
                  </div>
                </div>
              ) : (
                // Show circle selection
                <Command className="rounded-lg border shadow-md">
                  <CommandInput
                    placeholder="Search circles..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                    className="border-none focus:ring-0"
                  />
                  <CommandList className="max-h-[200px] overflow-auto">
                    <CommandEmpty>No circles found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCircles.map((circle) => (
                        <CommandItem
                          key={circle.id}
                          value={circle.id.toString()}
                          onSelect={() => setSelectedCircleId(circle.id)}
                          className="flex items-start gap-2 p-2 cursor-pointer"
                        >
                          <div
                            className="w-3 h-3 mt-1 rounded-full flex-shrink-0"
                            style={{
                              backgroundColor: circle.color || "#c5c5c5",
                            }}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{circle.name}</div>
                            {circle.description && (
                              <div className="text-xs text-muted-foreground line-clamp-1">
                                {circle.description}
                              </div>
                            )}
                            <div className="text-xs text-muted-foreground mt-1">
                              Visibility: {circle.visibility}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role-select">Circle Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) =>
                  setSelectedRole(value as "control" | "treatment" | "observation")
                }
                disabled={!selectedCircleId}
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
              <p className="text-xs text-muted-foreground">
                <span className="font-medium">Control:</span> Baseline group with standard content<br />
                <span className="font-medium">Treatment:</span> Experimental group with modified content<br />
                <span className="font-medium">Observation:</span> Circle members can view but not participate
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAddCircleOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAddCircle}
              disabled={!selectedCircleId}
            >
              Add Circle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LabCircleSelector;