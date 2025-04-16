import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lab, Circle, Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { 
  analyzeMetric, 
  generateRecommendation as apiGenerateRecommendation, 
  groupPostsByCircleRole,
  getLabAnalysisResults,
  deleteLabAnalysisResults,
  analyzeMetricWithCache,
  generateRecommendationWithCache
} from "@/lib/metricsApi";

// Type definitions for metric results
export interface MetricResult {
  name: string;
  target: string | number;  // Allow both string and number types for target
  priority: "high" | "medium" | "low";
  actual: string;
  status: "success" | "warning" | "fail";
  confidence: number;
  difference: string;
  analysis?: string; // Optional detailed analysis from LLM
}

// Type for a lab circle with role information
export interface LabCircle extends Circle {
  role: "control" | "treatment" | "observation";
}

// Type for circle posts data
export interface CirclePosts {
  circleId: number;
  posts: Post[];
}

// Type for recommendation
export interface Recommendation {
  decision: "go" | "wait" | "rethink";
  confidence: number;
  reasoning: string;
}

// Import formatMetricValue from formatters utility
export { formatMetricValue } from "@/lib/formatters";

/**
 * Hook that analyzes lab metrics and generates results and recommendations
 */
export const useLabResultsAnalysis = (lab: Lab) => {
  const { toast } = useToast();
  const [metricResults, setMetricResults] = useState<MetricResult[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<Error | null>(null);
  const [fromCache, setFromCache] = useState<boolean>(false);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string | null>(null);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  
  // State to track the last analysis signature to prevent infinite loops
  const [lastAnalysisSignature, setLastAnalysisSignature] = useState<string>("");

  // Flag to indicate if we need to load data for analysis
  const [shouldLoadData, setShouldLoadData] = useState<boolean>(false);

  // State to track which steps of the analysis process are complete
  const [analysisState, setAnalysisState] = useState({
    checkingCache: false,
    processingData: false,
    generatingAnalysis: false
  });

  // Check for cached analysis results
  const checkCachedResults = async () => {
    if (!lab?.id) return false;
    
    try {
      // Record start time for performance measurement
      const cacheCheckStartTime = performance.now();
      
      // Update the analysis state to indicate we're checking cache
      setAnalysisState(prev => ({ ...prev, checkingCache: true }));
      console.log(`[PERFORMANCE] Checking for cached analysis results for lab ${lab.id}`);
      const cachedResults = await getLabAnalysisResults(lab.id);
      
      // Record end time and log duration
      const cacheCheckEndTime = performance.now();
      console.log(`[PERFORMANCE] Cache check completed in ${(cacheCheckEndTime - cacheCheckStartTime).toFixed(2)}ms`);
      
      // Mark cache checking as complete
      setAnalysisState(prev => ({ ...prev, checkingCache: false }));
      
      if (cachedResults && cachedResults.exists) {
        console.log(`[PERFORMANCE] Found cached analysis results for lab ${lab.id}`, cachedResults);
        setMetricResults(cachedResults.metricResults);
        setRecommendation(cachedResults.recommendation);
        setFromCache(true);
        setLastAnalysisTime(cachedResults.updatedAt);
        return true;
      } else {
        console.log(`[PERFORMANCE] No cached analysis results found for lab ${lab.id}`);
        // Since we'll need to generate a fresh analysis, update the processing state
        setAnalysisState(prev => ({ ...prev, processingData: true }));
      }
      
      return false;
    } catch (error) {
      console.error("Error checking cached results:", error);
      setAnalysisState(prev => ({ ...prev, checkingCache: false }));
      return false;
    }
  };

  // Immediate check for cached results
  useEffect(() => {
    if (lab?.id && (lab.status === "active" || lab.status === "completed") && !isAnalyzing) {
      const checkInitialCache = async () => {
        setIsAnalyzing(true);
        setAnalysisState({
          checkingCache: true,
          processingData: false,
          generatingAnalysis: false
        });

        try {
          const foundCache = await checkCachedResults();
          if (!foundCache) {
            // If no cache found, set flag to load data for analysis
            setShouldLoadData(true);
          } else {
            setIsAnalyzing(false);
          }
        } catch (error) {
          console.error("Error checking initial cache:", error);
          setShouldLoadData(true);
          setIsAnalyzing(false);
        }
      };
      
      checkInitialCache();
    }
  }, [lab?.id, lab?.status]);

  // Set up the load timing when shouldLoadData changes
  useEffect(() => {
    if (shouldLoadData && !loadStartTime) {
      const startTime = performance.now();
      setLoadStartTime(startTime);
      console.log(`[PERFORMANCE] Starting to load lab data at ${startTime.toFixed(2)}ms`);
    }
  }, [shouldLoadData, loadStartTime]);

  // Only fetch lab circles data if we need to generate a fresh analysis
  const { 
    data: labCirclesData, 
    isLoading: isCirclesLoading,
    error: circlesError
  } = useQuery<any[]>({
    queryKey: [`/api/labs/${lab?.id}/circles`],
    enabled: !!lab?.id && shouldLoadData
  });
  
  // Transform the lab circles data to include role information
  const labCircles = labCirclesData?.map(item => {
    // The server returns data with the role at the top level and circle data in a nested object
    return {
      ...item.circle,
      role: item.role
    } as LabCircle;
  });

  // Fetch circle posts data for all circles in the lab - only when needed and circles are loaded
  const {
    data: circlePostsData,
    isLoading: isPostsLoading,
    error: postsError
  } = useQuery<any[]>({
    queryKey: [`/api/labs/${lab?.id}/posts`],
    enabled: !!lab?.id && shouldLoadData && !!labCircles && labCircles.length > 0
  });
  
  // Transform the posts data to the format expected by the analyzer
  const circlePosts = circlePostsData?.map(post => {
    // Return a simplified post object with just the required fields
    return {
      id: post.id,
      circleId: post.circleId,
      content: post.content,
      createdAt: post.createdAt,
      // Add any other needed fields
    } as Post;
  });

  // Main analysis function
  const analyzeLabMetrics = async (forceRefresh: boolean = false) => {
    // Start timing the analysis process
    const analysisStartTime = performance.now();
    console.log(`[PERFORMANCE] Starting full analysis process at ${analysisStartTime.toFixed(2)}ms`);
    
    // Early return checks
    if (!lab?.successMetrics?.metrics || lab.successMetrics.metrics.length === 0) {
      console.log("No success metrics defined for this lab");
      setMetricResults([]);
      setRecommendation(null);
      return;
    }

    // Make sure we have the data we need
    if (!labCirclesData || !circlePostsData || labCirclesData.length === 0) {
      console.log("Missing or empty circle or post data for analysis");
      return;
    }

    // Set analyzing state
    setIsAnalyzing(true);
    setAnalyzeError(null);
    
    // Reset analysis state tracking
    setAnalysisState({
      checkingCache: forceRefresh ? false : true,
      processingData: false,
      generatingAnalysis: false
    });
    
    try {
      // Prepare the circle data from the API response
      const preparedCircles = labCirclesData.map(item => {
        return {
          id: item.circle?.id,
          name: item.circle?.name || 'Unknown Circle',
          role: item.role || 'observation',
          createdAt: item.circle?.createdAt
        } as LabCircle;
      });
      
      // Prepare the post data from the API response
      const preparedPosts = circlePostsData.map(post => {
        return {
          id: post.id,
          circleId: post.circleId,
          content: post.content || "",
          createdAt: post.createdAt
        } as Post;
      });

      console.log(`Analysis preparation complete: ${preparedCircles.length} circles, ${preparedPosts.length} posts`);
      
      // Group posts by circle role using our utility
      const { controlCircles, treatmentCircles, observationCircles } = 
        groupPostsByCircleRole(preparedCircles, preparedPosts);
      
      // Update analysis state to show we're done with data processing and starting AI analysis
      setAnalysisState(prev => ({ 
        ...prev, 
        processingData: false,
        generatingAnalysis: true
      }));
      
      // Analyze each metric using the API
      const analyzedMetrics = [];
      
      for (const metric of lab.successMetrics.metrics) {
        try {
          // Prepare the request data
          const requestData = {
            metric: {
              name: metric.name,
              target: metric.target,
              priority: metric.priority
            },
            labGoals: lab.goals || '',
            controlCircles,
            treatmentCircles,
            observationCircles
          };
          
          // Call the API endpoint for analysis with caching
          const result = await analyzeMetricWithCache(
            requestData,
            lab.id,
            lab.successMetrics.metrics.indexOf(metric),
            forceRefresh
          );
          analyzedMetrics.push(result);
        } catch (error) {
          console.error(`Error analyzing metric ${metric.name}:`, error);
          
          // Add a placeholder for failed metrics
          analyzedMetrics.push({
            name: metric.name,
            target: metric.target,
            priority: metric.priority,
            actual: 'Analysis failed',
            status: 'fail' as const,
            confidence: 0,
            difference: 'N/A',
            analysis: 'Failed to analyze this metric.'
          });
        }
      }
      
      setMetricResults(analyzedMetrics);
      
      // Generate an overall recommendation based on the results
      if (analyzedMetrics.length > 0) {
        try {
          // Update state to show AI generation is complete
          setAnalysisState(prev => ({ 
            ...prev, 
            generatingAnalysis: true 
          }));
          
          const recommendation = await generateRecommendationWithCache(
            analyzedMetrics,
            lab.status,
            lab.id,
            forceRefresh
          );
          setRecommendation(recommendation);
          
          // Mark all analysis steps as complete
          setAnalysisState({
            checkingCache: false,
            processingData: false,
            generatingAnalysis: false
          });
          
          // If we got results, mark as not from cache (freshly generated)
          // unless it explicitly returned fromCache=true
          if (recommendation && !('fromCache' in recommendation)) {
            setFromCache(false);
            setLastAnalysisTime(new Date().toISOString());
          } else if (recommendation && 'fromCache' in recommendation) {
            // Cast to any since our interface doesn't have fromCache
            const resultWithCache = recommendation as any;
            setFromCache(resultWithCache.fromCache);
            if (resultWithCache.updatedAt) {
              setLastAnalysisTime(resultWithCache.updatedAt);
            } else {
              setLastAnalysisTime(new Date().toISOString());
            }
          }
        } catch (error) {
          console.error("Error generating recommendation:", error);
          // Use fallback if API call fails
          setRecommendation({
            decision: "wait",
            confidence: 65,
            reasoning: "Recommendation analysis failed. Based on available metrics, it's suggested to wait for more data to make a final decision."
          });
        }
      }
    } catch (error) {
      console.error("Error analyzing lab metrics:", error);
      setAnalyzeError(error instanceof Error ? error : new Error('Unknown error during analysis'));
      toast({
        title: "Analysis Error",
        description: "Failed to analyze lab metrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Record completion time and log the total duration
      const analysisEndTime = performance.now();
      const totalDuration = analysisEndTime - analysisStartTime;
      console.log(`[PERFORMANCE] Full analysis process completed in ${totalDuration.toFixed(2)}ms`);
      
      // Reset all analysis states when we're done
      setIsAnalyzing(false);
      setAnalysisState({
        checkingCache: false,
        processingData: false,
        generatingAnalysis: false
      });
    }
  };
  
  // Refreshes analysis by forcing new generation (skips cache)
  const refreshAnalysis = async () => {
    if (!lab?.id) return;
    
    // Delete cached results first
    try {
      await deleteLabAnalysisResults(lab.id);
      setFromCache(false);
      
      // Ensure data is loaded before analysis
      if (!labCirclesData || !circlePostsData) {
        // We need to load data first
        setShouldLoadData(true);
      } else {
        // We already have the data loaded, just run analysis
        analyzeLabMetrics(true);
      }
    } catch (error) {
      console.error("Error refreshing analysis:", error);
      toast({
        title: "Refresh Error",
        description: "Failed to refresh lab analysis. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Trigger analysis when data loading completes (only if shouldLoadData is true)
  useEffect(() => {
    if (circlesError || postsError) {
      console.error("Circle or post errors:", { circlesError, postsError });
      setAnalyzeError(
        circlesError instanceof Error ? circlesError : 
        postsError instanceof Error ? postsError : 
        new Error('Failed to load lab data')
      );
      return;
    }
    
    // Only run analysis when data is fully loaded and we've determined we need a fresh analysis
    if (shouldLoadData && !isCirclesLoading && !isPostsLoading && labCirclesData && circlePostsData && !isAnalyzing) {
      // Log performance data when posts load completes
      if (loadStartTime) {
        const loadEndTime = performance.now();
        const loadDuration = loadEndTime - loadStartTime;
        console.log(`[PERFORMANCE] Lab data loaded in ${loadDuration.toFixed(2)}ms (Posts: ${circlePostsData.length}, Circles: ${labCirclesData.length})`);
        setLoadStartTime(null); // Reset for next time
      }
      
      // Use a stable string representation to avoid reference issues
      const dataSignature = `${lab?.id}-${labCirclesData.length}-${circlePostsData.length}`;
      
      // Use state to avoid re-running unnecessarily
      if (lastAnalysisSignature !== dataSignature) {
        // Update the signature state
        setLastAnalysisSignature(dataSignature);
        
        // Run the analysis - we already know we need fresh results because shouldLoadData is true
        analyzeLabMetrics(false);
      }
    }
  }, [lab?.id, shouldLoadData, isCirclesLoading, isPostsLoading, circlesError, postsError, isAnalyzing, lastAnalysisSignature, loadStartTime]);
  
  // Function to retry analysis if it fails
  const retryAnalysis = () => {
    setAnalyzeError(null);
    analyzeLabMetrics(false);
  };

  return { 
    metricResults, 
    recommendation, 
    isAnalyzing, 
    analyzeError, 
    retryAnalysis,
    refreshAnalysis,
    fromCache,
    lastAnalysisTime,
    analysisState  // Include the analysis stage state
  };
};