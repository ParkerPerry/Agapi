import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Lab } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface LabActivateButtonProps {
  lab: Lab;
  onActivated?: () => void;
}

export function LabActivateButton({ lab, onActivated }: LabActivateButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const activateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/labs/${lab.id}/activate`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Lab Activated",
        description: "Lab content has been published and data collection has begun.",
      });
      
      // Invalidate lab queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${lab.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${lab.id}/posts`] });
      
      if (onActivated) {
        onActivated();
      }
    },
    onError: (error: any) => {
      console.error("Error activating lab:", error);
      toast({
        title: "Activation Failed",
        description: error?.message || "Failed to activate lab. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (lab.status === "active" || lab.status === "completed") {
    return null;
  }

  return (
    <Button
      onClick={() => activateMutation.mutate()}
      disabled={activateMutation.isPending}
      className="min-w-[120px]"
    >
      {activateMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Activating...
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Activate Lab
        </>
      )}
    </Button>
  );
}