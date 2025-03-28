import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { AiFollowerCollective } from "@shared/schema";
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

interface LabCollectiveAddDialogProps {
  labId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  existingCollectiveIds: number[];
}

const LabCollectiveAddDialog = ({
  labId,
  open,
  onOpenChange,
  onSuccess,
  existingCollectiveIds,
}: LabCollectiveAddDialogProps) => {
  const { toast } = useToast();
  const [selectedCollectiveId, setSelectedCollectiveId] = useState<number | null>(null);
  const [selectedRole, setSelectedRole] = useState<"control" | "treatment" | "observation">("treatment");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSelectedCollectiveId(null);
      setSelectedRole("treatment");
      setSearchQuery("");
    }
  }, [open]);

  // Fetch user's AI follower collectives
  const {
    data: collectivesData,
    isLoading: isCollectivesLoading,
    error: collectivesError,
  } = useQuery<AiFollowerCollective[]>({
    queryKey: ["/api/ai-follower-collectives"],
    enabled: open,
  });

  const handleAddCollective = async () => {
    if (!selectedCollectiveId || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await apiRequest(`/api/labs/${labId}/collectives`, "POST", {
        collectiveId: selectedCollectiveId,
        role: selectedRole,
      });
      
      toast({
        title: "Collective added",
        description: "The AI collective has been added to the lab.",
      });
      
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Failed to add collective",
        description: "There was an error adding the AI collective to the lab.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter out collectives that are already in the lab
  const availableCollectives = collectivesData?.filter(
    (collective) => !existingCollectiveIds.includes(collective.id)
  ) || [];

  // Filter collectives by search query
  const filteredCollectives = searchQuery
    ? availableCollectives.filter(
        (collective) =>
          collective.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (collective.description &&
            collective.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : availableCollectives;
  
  // Find the selected collective for display
  const selectedCollective = selectedCollectiveId 
    ? availableCollectives.find(collective => collective.id === selectedCollectiveId) 
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5" />
            Add AI Collective to Lab
          </DialogTitle>
          <DialogDescription>
            Select an AI follower collective to add to your experiment lab and assign a role.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="collective-select">Select AI Collective</Label>
            {isCollectivesLoading ? (
              <div className="flex items-center justify-center h-[200px]">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : collectivesError ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-destructive">Failed to load AI collectives.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => window.location.reload()}
                >
                  Retry
                </Button>
              </div>
            ) : availableCollectives.length === 0 ? (
              <div className="text-center py-8 border rounded-md">
                <p className="text-muted-foreground">
                  No available AI collectives to add to this lab.
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  All your AI collectives are already part of this lab or you don't have any collectives yet.
                </p>
              </div>
            ) : selectedCollective ? (
              // Show selected collective
              <div className="rounded-lg border shadow-md p-3 flex items-start gap-2">
                <div className="flex-1">
                  <div className="font-medium">{selectedCollective.name}</div>
                  {selectedCollective.description && (
                    <div className="text-xs text-muted-foreground line-clamp-2">
                      {selectedCollective.description}
                    </div>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="mt-2 text-xs"
                    onClick={() => setSelectedCollectiveId(null)}
                  >
                    Change
                  </Button>
                </div>
              </div>
            ) : (
              // Show collective selection
              <Command className="rounded-lg border shadow-md">
                <CommandInput
                  placeholder="Search AI collectives..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                  className="border-none focus:ring-0"
                />
                <CommandList className="max-h-[200px] overflow-auto">
                  <CommandEmpty>No AI collectives found.</CommandEmpty>
                  <CommandGroup>
                    {filteredCollectives.map((collective) => (
                      <CommandItem
                        key={collective.id}
                        value={collective.id.toString()}
                        onSelect={() => setSelectedCollectiveId(collective.id)}
                        className="flex items-start gap-2 p-2 cursor-pointer"
                      >
                        <div className="flex-1">
                          <div className="font-medium">{collective.name}</div>
                          {collective.description && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {collective.description}
                            </div>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="role-select">Collective Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(value) =>
                setSelectedRole(value as "control" | "treatment" | "observation")
              }
              disabled={!selectedCollectiveId}
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
            onClick={handleAddCollective}
            disabled={!selectedCollectiveId || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Collective"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LabCollectiveAddDialog;