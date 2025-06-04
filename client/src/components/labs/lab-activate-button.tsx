import { useState, useEffect } from "react";
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
  const [isPublishing, setIsPublishing] = useState(false);

  // Listen for WebSocket notifications about lab activation progress
  useEffect(() => {
    const handleWebSocketMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'lab_activation_started' && data.labId === lab.id) {
          setIsPublishing(true);
          toast({
            title: "Publishing Lab Content",
            description: "Lab content is being published to circles in the background...",
          });
        }
        
        if (data.type === 'lab_activation_completed' && data.labId === lab.id) {
          setIsPublishing(false);
          
          if (data.success) {
            toast({
              title: "Lab Activation Complete",
              description: "Lab content successfully published with AI responses scheduled",
            });
          } else {
            toast({
              title: "Lab Activation Issue",
              description: data.error || "Some content may not have been published correctly",
              variant: "destructive",
            });
          }
          
          // Invalidate queries to refresh the UI
          queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
          queryClient.invalidateQueries({ queryKey: [`/api/labs/${lab.id}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/labs/${lab.id}/posts`] });
          
          if (onActivated) {
            onActivated();
          }
        }
      } catch (error) {
        // Ignore non-JSON messages
      }
    };

    // Add WebSocket listener
    const ws = (window as any).globalWebSocket;
    if (ws) {
      ws.addEventListener('message', handleWebSocketMessage);
    }

    return () => {
      if (ws) {
        ws.removeEventListener('message', handleWebSocketMessage);
      }
    };
  }, [lab.id, toast, queryClient, onActivated]);

  const activateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/labs/${lab.id}/status`, "PATCH", {
        status: "active"
      });
    },
    onSuccess: () => {
      toast({
        title: "Lab Activated",
        description: "Lab status updated. Content publishing is starting in the background...",
      });
      
      // Immediate UI update
      queryClient.invalidateQueries({ queryKey: ["/api/labs"] });
      queryClient.invalidateQueries({ queryKey: [`/api/labs/${lab.id}`] });
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
      disabled={activateMutation.isPending || isPublishing}
      className="min-w-[120px]"
    >
      {activateMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Activating...
        </>
      ) : isPublishing ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Publishing...
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