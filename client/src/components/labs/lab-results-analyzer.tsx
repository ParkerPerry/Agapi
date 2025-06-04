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
import { LabResponseProgressIndicator } from "./lab-response-progress-indicator";

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

  // State for pending response management
  const [showProgressIndicator, setShowProgressIndicator] = useState(false);
  const [hasPendingResponses, setHasPendingResponses] = useState(false);

  // Check for pending responses before running analysis
  const checkPendingResponses = async () => {
    if (!lab?.id) return false;
    
    try {
      const response = await fetch(`/api/labs/${lab.id}/pending-responses`);
      if (!response.ok) {
        console.warn("Could not check pending responses, proceeding with analysis");
        return false;
      }
      
      const pendingStats = await response.json();
      const hasPending = pendingStats.pending > 0;
      
      setHasPendingResponses(hasPending);
      
      if (hasPending) {
        console.log(`[Lab ${lab.id}] Found ${pendingStats.pending} pending responses (${pendingStats.completionPercentage}% complete)`);
        setShowProgressIndicator(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Error checking pending responses:", error);
      return false;
    }
  };

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
            // Check for pending responses before proceeding with fresh analysis
            const hasPending = await checkPendingResponses();
            if (!hasPending) {
              // No pending responses, safe to proceed with analysis
              setShouldLoadData(true);
            } else {
              // Has pending responses, show progress indicator
              setIsAnalyzing(false);
            }
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
    
    // Special handling for Lab 205
    if (lab?.id === 205) {
      console.log(`[Lab205Debug] ====== STARTING LAB 205 DETAILED ANALYSIS ======`);
      console.log(`[Lab205Debug] Analysis with force refresh: ${forceRefresh}`);
      console.log(`[Lab205Debug] Data loaded: ${labCirclesData?.length || 0} circles, ${circlePostsData?.length || 0} posts`);
    }
    
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
      
      // Special debugging for Lab 205 to identify circle/post issues
      if (lab?.id === 205) {
        console.log(`[Lab205Debug] Posts grouped by role:`);
        console.log(`[Lab205Debug] Control circles: ${controlCircles.length}, total posts: ${controlCircles.reduce((sum, c) => sum + c.posts.length, 0)}`);
        console.log(`[Lab205Debug] Treatment circles: ${treatmentCircles.length}, total posts: ${treatmentCircles.reduce((sum, c) => sum + c.posts.length, 0)}`);
        console.log(`[Lab205Debug] Observation circles: ${observationCircles?.length || 0}, total posts: ${observationCircles?.reduce((sum, c) => sum + c.posts.length, 0) || 0}`);
        
        // Check for any content size issues
        const checkCircleContent = (circles, role) => {
          let totalContentLength = 0;
          let maxContentLength = 0;
          let largeContentPosts = 0;
          
          circles.forEach(circle => {
            circle.posts.forEach(post => {
              const contentLength = post.content?.length || 0;
              totalContentLength += contentLength;
              maxContentLength = Math.max(maxContentLength, contentLength);
              if (contentLength > 10000) {
                largeContentPosts++;
              }
            });
          });
          
          console.log(`[Lab205Debug] ${role} circles content stats:`);
          console.log(`[Lab205Debug] - Total content size: ${(totalContentLength / 1024).toFixed(2)} KB`);
          console.log(`[Lab205Debug] - Max post size: ${(maxContentLength / 1024).toFixed(2)} KB`);
          console.log(`[Lab205Debug] - Large posts (>10KB): ${largeContentPosts}`);
        };
        
        checkCircleContent(controlCircles, 'Control');
        checkCircleContent(treatmentCircles, 'Treatment');
        if (observationCircles?.length) {
          checkCircleContent(observationCircles, 'Observation');
        }
      }
      
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
          let requestData;
          
          // Special handling for Lab 205 - implement content size limits
          if (lab?.id === 205) {
            console.log(`[Lab205Debug] Preparing request data for metric: ${metric.name}`);
            
            // Enhanced helper function to intelligently sample and limit content size
            const limitCircleContent = (circles, maxPostsPerCircle = 15, maxContentLength = 1000) => {
              return circles.map(circle => {
                // If this circle has few posts, we don't need to sample
                if (!circle.posts || circle.posts.length <= maxPostsPerCircle) {
                  // Just limit content length
                  return {
                    id: circle.id,
                    name: circle.name,
                    posts: (circle.posts || []).map(post => ({
                      ...post,
                      content: post.content && post.content.length > maxContentLength 
                        ? post.content.substring(0, maxContentLength) 
                        : post.content || ""
                    }))
                  };
                }
                
                // Log detailed sampling statistics
                console.log(`[Data Sampling] Circle ${circle.id}: Sampling ${maxPostsPerCircle} posts from ${circle.posts.length} total`);
                
                // More sophisticated post scoring and sampling
                const scorePosts = (posts) => {
                  return posts.map(post => {
                    // Base score starts with interactions (if available)
                    let score = post.metrics?.interactions || 0;
                    
                    // Recency bonus (posts from last 7 days get a boost)
                    const postDate = new Date(post.createdAt || Date.now());
                    const daysSinceCreation = (Date.now() - postDate.getTime()) / (1000 * 60 * 60 * 24);
                    if (daysSinceCreation < 7) {
                      score += 5; // Boost recent posts
                    }
                    
                    // Content length consideration - middle length posts (300-1000 chars) get slight boost
                    const contentLength = post.content?.length || 0;
                    if (contentLength >= 300 && contentLength <= 1000) {
                      score += 2; // Boost medium-length posts
                    }
                    
                    return { ...post, _score: score };
                  });
                };
                
                // Score and sort posts
                const scoredPosts = scorePosts(circle.posts);
                const sortedPosts = [...scoredPosts].sort((a, b) => b._score - a._score);
                
                // Take top scored posts but ensure diversity (include some lower scored posts too)
                const topPosts = sortedPosts.slice(0, Math.floor(maxPostsPerCircle * 0.7)); // 70% top scored
                const remainingPostsPool = sortedPosts.slice(Math.floor(maxPostsPerCircle * 0.7));
                
                // Select random posts from the remaining pool
                const randomPosts = [];
                const remainingSlots = maxPostsPerCircle - topPosts.length;
                
                if (remainingSlots > 0 && remainingPostsPool.length > 0) {
                  for (let i = 0; i < remainingSlots && i < remainingPostsPool.length; i++) {
                    const randomIndex = Math.floor(Math.random() * remainingPostsPool.length);
                    randomPosts.push(remainingPostsPool[randomIndex]);
                    remainingPostsPool.splice(randomIndex, 1);
                  }
                }
                
                // Combine top scored posts with random samples
                const sampledPosts = [...topPosts, ...randomPosts];
                
                // Log sampling completion
                console.log(`[Data Sampling] Circle ${circle.id}: Selected ${sampledPosts.length} posts (${topPosts.length} by score, ${randomPosts.length} random)`);
                
                // Apply content length limits
                const limitedPosts = sampledPosts.map(post => ({
                  ...post,
                  content: post.content && post.content.length > maxContentLength 
                    ? post.content.substring(0, maxContentLength) 
                    : post.content || "",
                  // Remove the temporary scoring property
                  _score: undefined 
                }));
                
                return {
                  id: circle.id,
                  name: circle.name,
                  posts: limitedPosts
                };
              });
            };
            
            // Create size-limited request data for Lab 205
            requestData = {
              metric: {
                name: metric.name,
                target: metric.target,
                priority: metric.priority
              },
              labGoals: (lab.goals || '').substring(0, 500), // Limit goals length
              controlCircles: limitCircleContent(controlCircles, 15),
              treatmentCircles: limitCircleContent(treatmentCircles, 15),
              observationCircles: observationCircles ? limitCircleContent(observationCircles, 10) : undefined
            };
            
            // Log the reduced data size
            console.log(`[Lab205Debug] Reduced request data: ${controlCircles.length} control circles with max 15 posts each`);
            console.log(`[Lab205Debug] Content limited to max 1000 chars per post`);
          } else {
            // Define the smart sampling and limiting function for all labs
            const limitCircleContent = (circles, maxPostsPerCircle = 15, maxContentLength = 1000) => {
              return circles.map(circle => {
                // If this circle has few posts, just limit content length
                if (!circle.posts || circle.posts.length <= maxPostsPerCircle) {
                  return {
                    id: circle.id,
                    name: circle.name,
                    posts: (circle.posts || []).map(post => ({
                      ...post,
                      content: post.content && post.content.length > maxContentLength 
                        ? post.content.substring(0, maxContentLength) 
                        : post.content || ""
                    }))
                  };
                }
                
                // Sort posts by interactions or recency for larger datasets
                const sortedPosts = [...circle.posts].sort((a, b) => {
                  const aInteractions = a.metrics?.interactions || 0;
                  const bInteractions = b.metrics?.interactions || 0;
                  
                  // First sort by interactions if available
                  if (aInteractions !== bInteractions) {
                    return bInteractions - aInteractions; // Higher interactions first
                  }
                  
                  // Then by date if interactions are equal
                  const aDate = new Date(a.createdAt || 0);
                  const bDate = new Date(b.createdAt || 0);
                  return bDate.getTime() - aDate.getTime(); // Most recent first
                });
                
                // Sample the posts
                const sampledPosts = sortedPosts.slice(0, maxPostsPerCircle);
                
                // Apply content length limits
                return {
                  id: circle.id,
                  name: circle.name,
                  posts: sampledPosts.map(post => ({
                    ...post,
                    content: post.content && post.content.length > maxContentLength 
                      ? post.content.substring(0, maxContentLength) 
                      : post.content || ""
                  }))
                };
              });
            };

            // Use smart sampling for all labs, not just Lab 205
            requestData = {
              metric: {
                name: metric.name,
                target: metric.target,
                priority: metric.priority
              },
              labGoals: lab.goals || '',
              controlCircles: limitCircleContent(controlCircles),
              treatmentCircles: limitCircleContent(treatmentCircles),
              observationCircles: observationCircles ? limitCircleContent(observationCircles) : undefined
            };
            
            // Log dataset size information
            console.log(`[MetricsAnalysis] Using smart data sampling for lab ${lab.id}`);
            console.log(`[MetricsAnalysis] Prepared ${controlCircles.length} control circles and ${treatmentCircles.length} treatment circles`);
          }
          
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

  // Callback for when user chooses to proceed despite pending responses
  const handleProceedWithAnalysis = () => {
    setShowProgressIndicator(false);
    setShouldLoadData(true);
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
    analysisState,  // Include the analysis stage state
    showProgressIndicator,
    hasPendingResponses,
    handleProceedWithAnalysis
  };
};