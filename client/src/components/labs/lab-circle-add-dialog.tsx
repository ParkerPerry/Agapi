import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Circle } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, PlusCircle, Search } from "lucide-react";

interface LabCircleAddDialogProps {
  labId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingCircleIds: number[];
}

const LabCircleAddDialog = ({
  labId,
  open,
  onOpenChange,
  onSuccess,
  existingCircleIds,
}: LabCircleAddDialogProps) => {
  const { toast } = useToast();
  const [selectedCircleId, setSelectedCircleId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<"control" | "treatment" | "observation">("treatment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedCircleId(null);
      setSelectedRole("treatment");
      setSearchQuery("");
    }
  }, [open]);

  // Fetch user's circles
  const {
    data: circlesData,
    isLoading: isCirclesLoading,
    error: circlesError,
  } = useQuery({
    queryKey: ["/api/circles"],
    enabled: open,
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

  const handleAddCircle = async () => {
    if (!selectedCircleId || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/labs/${labId}/circles`, "POST", {
        circleId: selectedCircleId,
        role: selectedRole,
      });
      
      toast({
        title: "Circle added",
        description: "The circle has been added to the lab.",
      });
      
      onOpenChange(false);
      onSuccess();
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

  // Filter out circles that are already in the lab
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">Control:</span> Baseline group with standard content<br />
              <span className="font-medium">Treatment:</span> Experimental group with modified content
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
            onClick={handleAddCircle}
            disabled={!selectedCircleId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Circle"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabCircleAddDialog;