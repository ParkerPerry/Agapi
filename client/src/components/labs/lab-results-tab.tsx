import { Lab } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useLabResultsAnalysis } from "./lab-results-analyzer";
import { MetricAnalysisCard } from "./metric-analysis-card";
import { ResultsSummaryCard } from "./results-summary-card";
import { LabResponseProgressIndicator } from "./lab-response-progress-indicator";

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
                lastAnalysisTime,
                analysisState,
                showProgressIndicator,
                hasPendingResponses,
                handleProceedWithAnalysis
              } = useLabResultsAnalysis(lab);
              
              // Show progress indicator if there are pending responses
              if (showProgressIndicator && hasPendingResponses) {
                return (
                  <LabResponseProgressIndicator
                    labId={lab.id}
                    onProceed={handleProceedWithAnalysis}
                  />
                );
              }
              
              // Show loading state during analysis
              if (isAnalyzing) {
                return (
                  <div className="flex flex-col items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                    <div className="text-center space-y-2">
                      <p className="text-sm font-medium">
                        Analyzing lab metrics with AI...
                      </p>
                      <div className="flex flex-col gap-2 max-w-md">
                        {/* Cache checking step */}
                        <div className={`flex items-center gap-2 text-xs ${analysisState.checkingCache ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          <div className="relative w-7 h-7 flex items-center justify-center">
                            {analysisState.checkingCache ? (
                              <Loader2 className="w-4 h-4 animate-spin absolute" />
                            ) : analysisState.checkingCache === false ? (
                              <CheckCircle className="w-4 h-4 text-green-500 absolute" />
                            ) : (
                              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full absolute"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span>Checking cache for existing analysis</span>
                            <div className="w-full h-1 bg-muted-foreground/20 rounded-full mt-1.5 overflow-hidden">
                              <div className={`h-full transition-all ${analysisState.checkingCache ? 'w-full animate-pulse bg-primary' : analysisState.checkingCache === false ? 'w-full bg-green-500' : 'w-0'}`}></div>
                            </div>
                          </div>
                        </div>

                        {/* Data processing step */}
                        <div className={`flex items-center gap-2 text-xs ${analysisState.processingData ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          <div className="relative w-7 h-7 flex items-center justify-center">
                            {analysisState.processingData ? (
                              <Loader2 className="w-4 h-4 animate-spin absolute" />
                            ) : analysisState.processingData === false ? (
                              <CheckCircle className="w-4 h-4 text-green-500 absolute" />
                            ) : (
                              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full absolute"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span>Processing metrics data</span>
                            <div className="w-full h-1 bg-muted-foreground/20 rounded-full mt-1.5 overflow-hidden">
                              <div className={`h-full transition-all ${analysisState.processingData ? 'w-full animate-pulse bg-primary' : analysisState.processingData === false ? 'w-full bg-green-500' : 'w-0'}`}></div>
                            </div>
                          </div>
                        </div>

                        {/* AI insight generation step */}
                        <div className={`flex items-center gap-2 text-xs ${analysisState.generatingAnalysis ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                          <div className="relative w-7 h-7 flex items-center justify-center">
                            {analysisState.generatingAnalysis ? (
                              <Loader2 className="w-4 h-4 animate-spin absolute" />
                            ) : analysisState.generatingAnalysis === false ? (
                              <CheckCircle className="w-4 h-4 text-green-500 absolute" />
                            ) : (
                              <div className="w-2 h-2 bg-muted-foreground/40 rounded-full absolute"></div>
                            )}
                          </div>
                          <div className="flex-1">
                            <span>Generating insight with AI</span>
                            <div className="w-full h-1 bg-muted-foreground/20 rounded-full mt-1.5 overflow-hidden">
                              <div className={`h-full transition-all ${analysisState.generatingAnalysis ? 'w-full animate-pulse bg-primary' : analysisState.generatingAnalysis === false ? 'w-full bg-green-500' : 'w-0'}`}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-3">
                        This may take 15-30 seconds for fresh analysis
                      </p>
                    </div>
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
                      <div className="pt-4 mt-2 border-t space-y-2">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="bg-muted p-2 rounded-md flex items-center text-sm">
                            {fromCache ? (
                              <>
                                <div className="flex items-center mr-2 bg-amber-100 text-amber-700 px-2 py-1 rounded">
                                  <span className="inline-block h-2 w-2 rounded-full bg-amber-500 mr-1.5"></span>
                                  <span className="font-medium text-xs">CACHED</span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  <span className="font-medium">Analysis retrieved from cache</span>
                                  {lastAnalysisTime && (
                                    <span className="block text-muted-foreground/70">
                                      Generated: {new Date(lastAnalysisTime).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="flex items-center mr-2 bg-green-100 text-green-700 px-2 py-1 rounded">
                                  <span className="inline-block h-2 w-2 rounded-full bg-green-500 mr-1.5"></span>
                                  <span className="font-medium text-xs">FRESH</span>
                                </div>
                                <div className="text-muted-foreground text-xs">
                                  <span className="font-medium">Fresh analysis just generated</span>
                                  {lastAnalysisTime && (
                                    <span className="block text-muted-foreground/70">
                                      Generated: {new Date(lastAnalysisTime).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-xs text-muted-foreground">
                              {fromCache && "Results served from cache to reduce AI calls"}
                            </div>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={refreshAnalysis}
                              disabled={isAnalyzing}
                              className="shrink-0"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                                  Refreshing...
                                </>
                              ) : (
                                <>
                                  {fromCache ? 'Generate Fresh Analysis' : 'Refresh Analysis'}
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Tooltip about cache usage */}
                        <div className="text-xs text-muted-foreground/70 flex items-center gap-1.5">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="h-3.5 w-3.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4M12 8h.01" />
                          </svg>
                          <span>
                            Analysis is cached to reduce AI usage. Click "Generate Fresh Analysis" for updated insights.
                          </span>
                        </div>
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