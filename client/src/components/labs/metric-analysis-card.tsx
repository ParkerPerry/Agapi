import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle, 
  AlertTriangle 
} from "lucide-react";
import { MetricResult } from "./lab-results-analyzer";
import { formatMetricValue } from "@/lib/formatters";

interface MetricAnalysisCardProps {
  metric: MetricResult;
}

export function MetricAnalysisCard({ metric }: MetricAnalysisCardProps) {
  // Extract values with default fallbacks for null/undefined values
  const { 
    name = 'Unknown Metric', 
    target = 'N/A', 
    actual = 'N/A', 
    status = 'fail', 
    priority = 'medium', 
    confidence = 0, 
    difference = 'N/A' 
  } = metric || {};
  
  // Determine card styling based on status
  const getStatusStyles = () => {
    switch (status) {
      case "success":
        return {
          borderColor: "border-green-200",
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          textColor: "text-green-600",
          progressColor: "bg-green-600",
        };
      case "warning":
        return {
          borderColor: "border-amber-200",
          icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
          textColor: "text-amber-600",
          progressColor: "bg-amber-600",
        };
      case "fail":
        return {
          borderColor: "border-red-200",
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          textColor: "text-red-600",
          progressColor: "bg-red-600",
        };
      default:
        return {
          borderColor: "border-gray-200",
          icon: <AlertCircle className="h-5 w-5 text-gray-500" />,
          textColor: "text-gray-500",
          progressColor: "bg-gray-500",
        };
    }
  };
  
  const styles = getStatusStyles();
  
  return (
    <Card className={`overflow-hidden border ${styles.borderColor}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h4 className="text-sm font-medium mb-1">{name}</h4>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Target: {formatMetricValue(target)}</p>
              <Badge variant={priority === "high" ? "default" : (priority === "medium" ? "secondary" : "outline")}>
                {priority}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {styles.icon}
            <span className={`text-sm font-medium ${styles.textColor}`}>
              {status === "success" ? "Success" : status === "warning" ? "Near Target" : "Below Target"}
            </span>
          </div>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-baseline">
            <span className={`text-2xl font-bold ${styles.textColor}`}>{formatMetricValue(actual)}</span>
            {difference && (
              <span className={`text-sm font-medium ${styles.textColor}`}>{difference}</span>
            )}
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs">
              <span>Confidence</span>
              <span>{confidence}%</span>
            </div>
            <Progress value={confidence} className={`h-2 ${styles.progressColor}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}