import { LabRecommendation, MetricAnalysisResult, formatMetricValue } from "./lab-results-analyzer";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertTriangle, XCircle } from "lucide-react";

interface ResultsSummaryCardProps {
  recommendation: LabRecommendation;
  metricResults: MetricAnalysisResult[];
}

export function ResultsSummaryCard({ 
  recommendation,
  metricResults
}: ResultsSummaryCardProps) {
  const { decision, confidence, reasoning, color } = recommendation;
  
  // Calculate metrics met stats
  const totalMetrics = metricResults.length;
  const metricsMet = metricResults.filter(r => r.goalAchieved).length;
  const percentMet = totalMetrics > 0 ? (metricsMet / totalMetrics) * 100 : 0;
  
  // Get decision icon
  const getDecisionIcon = () => {
    switch(decision) {
      case "GO": 
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case "WAIT": 
        return <Clock className="h-6 w-6 text-amber-600" />;
      case "RETHINK": 
        return <AlertTriangle className="h-6 w-6 text-red-600" />;
    }
  };
  
  // Get color classes based on decision
  const getColorClasses = () => {
    switch(color) {
      case "green":
        return {
          border: "border-green-200",
          bg: "bg-green-50",
          text: "text-green-800",
          muted: "text-green-700",
          icon: "text-green-600",
          progress: "bg-green-500"
        };
      case "red":
        return {
          border: "border-red-200",
          bg: "bg-red-50",
          text: "text-red-800",
          muted: "text-red-700",
          icon: "text-red-600",
          progress: "bg-red-500"
        };
      default: // amber
        return {
          border: "border-amber-200",
          bg: "bg-amber-50",
          text: "text-amber-800",
          muted: "text-amber-700",
          icon: "text-amber-600",
          progress: "bg-amber-500"
        };
    }
  };
  
  const colors = getColorClasses();
  
  return (
    <Card className={`border-l-4 ${colors.border}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className={`${colors.bg} p-2 rounded-full`}>
            {getDecisionIcon()}
          </div>
          <span>Recommendation: {decision}</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className={`${colors.progress} h-2.5 rounded-full`} 
                style={{ width: `${percentMet}%` }}
              ></div>
            </div>
            <span className="text-sm font-medium">{percentMet.toFixed(0)}% goals met</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Confidence:</span>
            <Badge variant="outline" className={colors.text}>
              {confidence}%
            </Badge>
          </div>
          
          <p className={`text-sm ${colors.muted}`}>{reasoning}</p>
          
          <div className="pt-4 border-t">
            <h4 className="font-medium mb-2">Key Metrics</h4>
            <ul className="space-y-1 text-sm">
              {metricResults
                .sort((a, b) => {
                  // Sort high priority first, then by goal achievement
                  if (a.priority === "high" && b.priority !== "high") return -1;
                  if (a.priority !== "high" && b.priority === "high") return 1;
                  return a.goalAchieved === b.goalAchieved ? 0 : a.goalAchieved ? -1 : 1;
                })
                .slice(0, 5) // Show top 5 metrics
                .map((result, index) => (
                  <li key={index} className="flex items-center gap-2">
                    {result.goalAchieved 
                      ? <CheckCircle className="h-4 w-4 text-green-500" /> 
                      : <XCircle className="h-4 w-4 text-red-500" />}
                    <span>
                      {result.name}: {formatMetricValue(result.treatmentValue, result.name)}
                      {result.goalAchieved 
                        ? " (Goal met)" 
                        : ` (Goal: ${result.target})`}
                    </span>
                    <Badge variant={result.priority === "high" ? "default" : "outline"} className="ml-auto">
                      {result.priority}
                    </Badge>
                  </li>
                ))
              }
            </ul>
            
            {metricResults.length > 5 && (
              <p className="text-xs text-muted-foreground mt-2">
                Showing top 5 of {metricResults.length} metrics...
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}