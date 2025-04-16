import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  CheckCircle, 
  Clock 
} from "lucide-react";
import { Recommendation, MetricResult } from "./lab-results-analyzer";

interface ResultsSummaryCardProps {
  recommendation: Recommendation;
  metricResults: MetricResult[];
}

export function ResultsSummaryCard({ recommendation, metricResults }: ResultsSummaryCardProps) {
  // Extract values with default fallbacks for null/undefined values
  const { 
    decision = 'wait', 
    confidence = 50, 
    reasoning = 'No reasoning provided' 
  } = recommendation || {};
  
  // Ensure metricResults is an array before processing
  const safeMetricResults = Array.isArray(metricResults) ? metricResults : [];
  
  // Count metrics by status
  const statusCounts = safeMetricResults.reduce((acc, metric) => {
    // Ensure metric exists and has a valid status
    const status = metric?.status || 'fail';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, { success: 0, warning: 0, fail: 0 } as Record<string, number>);
  
  // Get recommendation styling based on decision
  const getDecisionStyles = () => {
    switch (decision) {
      case "go":
        return {
          bgColor: "bg-green-50",
          borderColor: "border-green-100",
          iconBgColor: "bg-green-100",
          icon: <CheckCircle className="h-5 w-5 text-green-600" />,
          textColor: "text-green-800",
          progressColor: "bg-green-600",
          title: "GO",
          subtitle: "High confidence",
        };
      case "wait":
        return {
          bgColor: "bg-amber-50",
          borderColor: "border-amber-100",
          iconBgColor: "bg-amber-100",
          icon: <Clock className="h-5 w-5 text-amber-600" />,
          textColor: "text-amber-800",
          progressColor: "bg-amber-600",
          title: "WAIT",
          subtitle: "More data needed",
        };
      case "rethink":
        return {
          bgColor: "bg-red-50",
          borderColor: "border-red-100",
          iconBgColor: "bg-red-100",
          icon: <AlertCircle className="h-5 w-5 text-red-600" />,
          textColor: "text-red-800",
          progressColor: "bg-red-600",
          title: "RETHINK",
          subtitle: "Results below targets",
        };
      default:
        return {
          bgColor: "bg-gray-50",
          borderColor: "border-gray-100",
          iconBgColor: "bg-gray-100",
          icon: <Clock className="h-5 w-5 text-gray-600" />,
          textColor: "text-gray-800",
          progressColor: "bg-gray-600",
          title: "INCONCLUSIVE",
          subtitle: "Insufficient data",
        };
    }
  };
  
  const styles = getDecisionStyles();
  
  return (
    <div className="space-y-4">
      <h3 className="text-base font-medium">Recommendation</h3>
      
      <Card className="overflow-hidden border-0">
        <CardContent className="p-0">
          <div className={`flex justify-between items-center rounded-md ${styles.bgColor} border ${styles.borderColor} p-4`}>
            <div className="flex items-center gap-3">
              <div className={`${styles.iconBgColor} h-10 w-10 rounded-full flex items-center justify-center`}>
                {styles.icon}
              </div>
              <div>
                <p className={`font-medium ${styles.textColor}`}>{styles.title}</p>
                <div className="flex items-center gap-1">
                  <p className={`text-xs ${styles.textColor}`}>{styles.subtitle}</p>
                  <p className={`text-xs ${styles.textColor}`}>({confidence}%)</p>
                </div>
              </div>
            </div>
            <div className={`text-sm ${styles.textColor} max-w-md`}>
              <p>{reasoning}</p>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium">Metrics Summary</h4>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Success ({statusCounts.success})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <span>Warning ({statusCounts.warning})</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Failed ({statusCounts.fail})</span>
                </div>
              </div>
            </div>
            
            <div className="h-2 flex rounded-full overflow-hidden">
              {statusCounts.success > 0 && (
                <div 
                  className="bg-green-500 h-full" 
                  style={{ width: `${(statusCounts.success / safeMetricResults.length) * 100}%` }}
                ></div>
              )}
              {statusCounts.warning > 0 && (
                <div 
                  className="bg-amber-500 h-full" 
                  style={{ width: `${(statusCounts.warning / safeMetricResults.length) * 100}%` }}
                ></div>
              )}
              {statusCounts.fail > 0 && (
                <div 
                  className="bg-red-500 h-full" 
                  style={{ width: `${(statusCounts.fail / safeMetricResults.length) * 100}%` }}
                ></div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}