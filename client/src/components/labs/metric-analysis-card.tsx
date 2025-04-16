import { MetricAnalysisResult, formatMetricValue } from "./lab-results-analyzer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface MetricAnalysisCardProps {
  metric: MetricAnalysisResult;
  isCompact?: boolean;
}

export function MetricAnalysisCard({ 
  metric,
  isCompact = false
}: MetricAnalysisCardProps) {
  const { 
    name, 
    controlValue, 
    treatmentValue,
    percentChange,
    goalAchieved,
    confidence,
    priority
  } = metric;
  
  // Determine colors based on goal achievement
  const borderColor = goalAchieved 
    ? "border-green-200" 
    : confidence > 60 
      ? "border-red-200" 
      : "border-amber-200";
      
  const textColor = goalAchieved 
    ? "text-green-600" 
    : confidence > 60 
      ? "text-red-600" 
      : "text-amber-600";
      
  const progressValue = 50 + (percentChange * 0.5);
  const progressColor = percentChange >= 0 ? "bg-green-500" : "bg-red-500";
  
  // Determine confidence indicator
  const getConfidenceIndicator = () => {
    if (confidence >= 70) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (confidence <= 30) return <XCircle className="h-4 w-4 text-red-500" />;
    return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  };
  
  // Get priority badge
  const getPriorityBadge = () => {
    let variant: "default" | "secondary" | "outline" = "outline";
    if (priority === "high") variant = "default";
    if (priority === "medium") variant = "secondary";
    
    return (
      <Badge variant={variant} className="ml-2">
        {priority}
      </Badge>
    );
  };
  
  // Generate status text
  const getStatusText = () => {
    if (goalAchieved) {
      return percentChange > 0 
        ? `+${percentChange.toFixed(1)}% above target` 
        : "Meets target";
    }
    
    return percentChange > 0 
      ? "Improved but below target" 
      : "Below target";
  };
  
  return (
    <Card className={`${borderColor} ${isCompact ? "h-full" : ""}`}>
      <CardHeader className={isCompact ? "pb-2" : ""}>
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center">
            {name}
            {!isCompact && getPriorityBadge()}
          </CardTitle>
          {!isCompact && (
            <Badge variant="outline" className={textColor}>
              {goalAchieved ? "Goal Met" : "Goal Not Met"}
            </Badge>
          )}
        </div>
        {!isCompact && (
          <CardDescription>
            Target: {metric.target}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className={isCompact ? "pt-0" : ""}>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Control</div>
            <div className="text-xl font-bold">{formatMetricValue(controlValue, name)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-muted-foreground">Treatment</div>
            <div className={`text-xl font-bold ${textColor}`}>{formatMetricValue(treatmentValue, name)}</div>
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Difference</span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge 
                    variant={percentChange > 0 ? "outline" : "outline"} 
                    className={percentChange > 0 ? "text-green-600" : "text-red-600"}
                  >
                    {percentChange > 0 ? "+" : ""}{percentChange.toFixed(1)}%
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage change from control to treatment</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Progress 
            value={progressValue} 
            max={100}
            className={`h-2 ${progressColor}`} 
          />
        </div>
        
        {!isCompact && (
          <div className="pt-3 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm">
                <span className="font-medium">Confidence:</span> {confidence}%
              </div>
              <div className="flex items-center">
                {getConfidenceIndicator()}
                <span className={`ml-1 text-sm ${textColor}`}>{getStatusText()}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}