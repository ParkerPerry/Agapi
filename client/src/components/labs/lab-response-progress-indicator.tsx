import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, AlertTriangle, Play } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LabResponseProgressIndicatorProps {
  labId: number;
  onProceedAnyway: () => void;
  onWaitForCompletion: () => void;
  isVisible: boolean;
}

interface PendingResponseStats {
  total: number;
  pending: number;
  completed: number;
  completionPercentage: number;
  pendingResponses: Array<{
    id: number;
    scheduledFor: string;
    aiFollower: {
      id: number;
      name: string;
    };
    post: {
      id: number;
      content: string;
    };
  }>;
}

export function LabResponseProgressIndicator({
  labId,
  onProceedAnyway,
  onWaitForCompletion,
  isVisible
}: LabResponseProgressIndicatorProps) {
  const [showDetails, setShowDetails] = useState(false);

  const {
    data: pendingStats,
    isLoading,
    error,
    refetch
  } = useQuery<PendingResponseStats>({
    queryKey: [`/api/labs/${labId}/pending-responses`],
    enabled: isVisible && !!labId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (!isVisible || isLoading) {
    return null;
  }

  if (error) {
    return (
      <Alert className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to check response completion status. You can proceed with analysis, but results may be incomplete.
        </AlertDescription>
      </Alert>
    );
  }

  // If all responses are complete, don't show the indicator
  if (!pendingStats || pendingStats.pending === 0) {
    return null;
  }

  const getStatusBadge = () => {
    if (pendingStats.completionPercentage >= 80) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Nearly Complete</Badge>;
    } else if (pendingStats.completionPercentage >= 50) {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800">In Progress</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Early Stage</Badge>;
    }
  };

  const formatTimeRemaining = (scheduledFor: string) => {
    const scheduledTime = new Date(scheduledFor);
    const now = new Date();
    const diffMinutes = Math.floor((scheduledTime.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes <= 0) {
      return "Processing now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m remaining`;
    } else {
      const hours = Math.floor(diffMinutes / 60);
      const minutes = diffMinutes % 60;
      return `${hours}h ${minutes}m remaining`;
    }
  };

  return (
    <Card className="mb-6 border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            AI Response Progress
          </CardTitle>
          {getStatusBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Response Completion</span>
            <span className="text-muted-foreground">
              {pendingStats.completed} of {pendingStats.total} responses received
            </span>
          </div>
          <Progress 
            value={pendingStats.completionPercentage} 
            className="h-2"
          />
          <div className="text-center">
            <span className="text-2xl font-bold text-amber-700">
              {pendingStats.completionPercentage}%
            </span>
            <span className="text-sm text-muted-foreground ml-1">complete</span>
          </div>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {pendingStats.pending} AI followers are still scheduled to respond to lab posts. 
            Running analysis now may result in incomplete insights.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={onWaitForCompletion}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Wait for completion
          </Button>
          <Button 
            onClick={onProceedAnyway}
            variant="secondary"
            size="sm"
            className="flex items-center gap-2"
          >
            <Play className="h-4 w-4" />
            Proceed anyway
          </Button>
          <Button
            onClick={() => setShowDetails(!showDetails)}
            variant="ghost"
            size="sm"
          >
            {showDetails ? "Hide" : "Show"} details
          </Button>
        </div>

        {showDetails && pendingStats.pendingResponses.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-3">Pending Responses:</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {pendingStats.pendingResponses.map((response) => (
                <div
                  key={response.id}
                  className="flex items-center justify-between text-xs p-2 bg-white rounded border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {response.aiFollower.name}
                    </div>
                    <div className="text-muted-foreground truncate">
                      "{response.post.content.substring(0, 50)}..."
                    </div>
                  </div>
                  <div className="text-right text-muted-foreground flex-shrink-0 ml-2">
                    {formatTimeRemaining(response.scheduledFor)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}