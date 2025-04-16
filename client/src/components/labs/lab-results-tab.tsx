import { Lab } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
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
              const { 
                metricResults, 
                recommendation, 
                isAnalyzing, 
                analyzeError, 
                retryAnalysis,
                refreshAnalysis,
                fromCache,
                lastAnalysisTime
              } = useLabResultsAnalysis(lab);
              
              // Show loading state during analysis
              if (isAnalyzing) {
                return (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Analyzing lab metrics with AI. This may take a moment...
                    </p>
                  </div>
                );
              }
              
              // Show error state if analysis failed
              if (analyzeError) {
                return (
                  <div className="flex flex-col items-center justify-center py-8">
                    <AlertCircle className="h-8 w-8 text-destructive mb-4" />
                    <p className="text-sm text-muted-foreground mb-4 max-w-md text-center">
                      There was an error analyzing the lab metrics: {" "}
                      {analyzeError.message || "Unknown error"}
                    </p>
                    <Button onClick={retryAnalysis} variant="outline">
                      Retry Analysis
                    </Button>
                  </div>
                );
              }
              
              return (
                <>
                  {/* Recommendation summary */}
                  {metricResults && metricResults.length > 0 && recommendation ? (
                    <ResultsSummaryCard 
                      recommendation={recommendation} 
                      metricResults={metricResults} 
                    />
                  ) : null}
                  
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
                    
                    {/* Cache status and refresh button */}
                    {metricResults && metricResults.length > 0 && (
                      <div className="flex justify-between items-center text-sm pt-4 mt-2 border-t">
                        <div className="text-muted-foreground">
                          {fromCache ? (
                            <span>
                              <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-2"></span>
                              Analysis from cache
                              {lastAnalysisTime && (
                                <span className="ml-2">
                                  (Generated: {new Date(lastAnalysisTime).toLocaleString()})
                                </span>
                              )}
                            </span>
                          ) : (
                            <span>
                              <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                              Fresh analysis
                              {lastAnalysisTime && (
                                <span className="ml-2">
                                  (Generated: {new Date(lastAnalysisTime).toLocaleString()})
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={refreshAnalysis}
                          disabled={isAnalyzing}
                        >
                          {isAnalyzing ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              Refreshing...
                            </>
                          ) : (
                            'Refresh Analysis'
                          )}
                        </Button>
                      </div>
                    )}
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