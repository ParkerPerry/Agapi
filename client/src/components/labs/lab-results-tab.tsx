import { Lab } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useLabResultsAnalysis } from "./lab-results-analyzer";
import { MetricAnalysisCard } from "./metric-analysis-card";
import { ResultsSummaryCard } from "./results-summary-card";

interface LabResultsTabProps {
  lab: Lab;
}

export function LabResultsTab({ lab }: LabResultsTabProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Results Analysis</CardTitle>
        <CardDescription>
          Analysis of experiment performance against defined goals and metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        {lab.status === "active" || lab.status === "completed" ? (
          <div className="space-y-6">
            {(() => {
              // Use IIFE to safely call the hook
              const { metricResults, recommendation } = useLabResultsAnalysis(lab);
              
              return (
                <>
                  {/* Recommendation summary */}
                  {metricResults && metricResults.length > 0 && recommendation && (
                    <ResultsSummaryCard 
                      recommendation={recommendation} 
                      metricResults={metricResults} 
                    />
                  )}
                  
                  {/* Individual metrics analysis */}
                  <div className="space-y-3">
                    <h3 className="text-base font-medium">Metrics Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {metricResults && metricResults.length > 0 ? (
                        metricResults.map((metric, index) => (
                          <MetricAnalysisCard 
                            key={index} 
                            metric={metric} 
                          />
                        ))
                      ) : (
                        <div className="col-span-2 text-center py-4">
                          <p className="text-muted-foreground">No metrics data available for this experiment</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        ) : (
          <div className="py-8 text-center border rounded-md">
            <p className="text-muted-foreground mb-2">This experiment hasn't been activated yet</p>
            <p className="text-sm text-muted-foreground">
              Activate the experiment to start collecting data and view results
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}