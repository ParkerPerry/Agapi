import { apiRequest } from './queryClient';
import { MetricResult, Recommendation, LabCircle } from '@/components/labs/lab-results-analyzer';
import { Post } from "@shared/schema";

/**
 * Interface for cached lab analysis results
 * 
 * Includes metadata about when the analysis was last updated along with
 * the full set of metric results and recommendation data.
 */
export interface LabAnalysisResult {
  exists: boolean;
  metricResults: MetricResult[];
  recommendation: Recommendation;
  updatedAt: string;  // ISO timestamp of when the analysis was last performed
  fromCache?: boolean; // Indicates if this result was retrieved from cache
}

/**
 * Interface for analyzing a metric with the API
 */
interface AnalyzeMetricRequest {
  metric: {
    name: string;
    target: string | number;
    priority: "high" | "medium" | "low";
  };
  labGoals: string;
  controlCircles: {
    id: number;
    name: string;
    posts: Post[];
  }[];
  treatmentCircles: {
    id: number;
    name: string;
    posts: Post[];
  }[];
  observationCircles?: {
    id: number;
    name: string;
    posts: Post[];
  }[];
}

/**
 * Interface for generating a recommendation with the API
 */
interface GenerateRecommendationRequest {
  metrics: MetricResult[];
  labStatus: string;
}

/**
 * Analyze a metric with the API
 * @param request The request data
 * @returns MetricResult with analysis data
 */
export async function analyzeMetric(request: AnalyzeMetricRequest): Promise<MetricResult> {
  try {
    // Using the correct API endpoint path that matches server routes
    const result = await apiRequest('/api/analyze-metric', 'POST', request);
    
    return {
      name: request.metric.name,
      target: request.metric.target,
      priority: request.metric.priority,
      actual: result.actual,
      status: result.status,
      confidence: result.confidence,
      difference: result.difference,
      analysis: result.analysis
    };
  } catch (error) {
    console.error('Error analyzing metric:', error);
    throw error;
  }
}

/**
 * Generate a recommendation with the API
 * @param metrics The metric results
 * @param labStatus The lab status
 * @returns Recommendation data
 */
export async function generateRecommendation(
  metrics: MetricResult[],
  labStatus: string
): Promise<Recommendation> {
  try {
    // Using the correct API endpoint path that matches server routes
    const result = await apiRequest('/api/analyze-recommendation', 'POST', {
      metrics,
      labStatus
    });
    
    return {
      decision: result.decision,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
  } catch (error) {
    console.error('Error generating recommendation:', error);
    throw error;
  }
}

/**
 * Get cached lab analysis results from the database
 * 
 * This function retrieves the complete set of cached analysis results for a specific lab,
 * including all metric analyses and the overall recommendation with timestamps.
 * 
 * The returned data includes:
 * - metricResults: Array of analyzed metrics with status and insights
 * - recommendation: Overall recommendation based on all metrics
 * - updatedAt: ISO timestamp of when the analysis was last performed
 * - fromCache: Always true for results from this endpoint
 * - exists: Always true for successful results
 * 
 * @param labId The lab ID to get cached results for
 * @returns Complete cached analysis results or null if not found
 */
export async function getLabAnalysisResults(labId: number): Promise<LabAnalysisResult | null> {
  try {
    const response = await apiRequest(`/api/lab-analysis/${labId}`, 'GET');
    
    if (response.exists) {
      return response;
    }
    return null;
  } catch (error) {
    console.error('Error getting cached lab analysis results:', error);
    return null;
  }
}

/**
 * Delete cached lab analysis results from the database
 * 
 * This function removes all cached analysis data for a specific lab,
 * including metric analyses and recommendations. Use this function
 * when you want to force a complete refresh of all analysis results,
 * such as when the lab data has been significantly updated.
 * 
 * After deletion, the next call to analyzeMetricWithCache or
 * generateRecommendationWithCache will generate fresh analysis
 * regardless of the forceRefresh parameter value.
 * 
 * @param labId The lab ID to delete cached results for
 * @returns Success status boolean - true if deletion was successful
 */
export async function deleteLabAnalysisResults(labId: number): Promise<boolean> {
  try {
    await apiRequest(`/api/lab-analysis/${labId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting cached lab analysis results:', error);
    return false;
  }
}

/**
 * Analyze a metric with the API using caching
 * 
 * This enhanced version of analyzeMetric supports caching results in the database.
 * It returns additional metadata about the cache status including:
 * - fromCache: boolean indicating if the result was served from cache
 * - updatedAt: ISO timestamp of when the analysis was last performed
 * 
 * @param request The request data containing metric details and circle posts
 * @param labId Optional lab ID for caching (required for caching to work)
 * @param metricIndex Optional metric index for caching multiple metrics per lab
 * @param forceRefresh If true, ignores cached results and generates fresh analysis
 * @returns MetricResult with analysis data and cache metadata
 */
export async function analyzeMetricWithCache(
  request: AnalyzeMetricRequest,
  labId?: number,
  metricIndex?: number,
  forceRefresh: boolean = false
): Promise<MetricResult & { fromCache?: boolean; updatedAt?: string; diagnostics?: any }> {
  try {
    // Special handling for Lab 205 to debug the issues
    if (labId === 205) {
      console.log(`[Lab205Debug] Starting metric analysis request for Lab 205, metrics[${metricIndex}]`);
      console.time('lab205-metric-analysis');
      
      // Log the data size for debugging
      const controlPostsCount = request.controlCircles.reduce((sum, c) => sum + c.posts.length, 0);
      const treatmentPostsCount = request.treatmentCircles.reduce((sum, c) => sum + c.posts.length, 0);
      const observationPostsCount = request.observationCircles ? 
        request.observationCircles.reduce((sum, c) => sum + c.posts.length, 0) : 0;
      
      const totalPosts = controlPostsCount + treatmentPostsCount + observationPostsCount;
      console.log(`[Lab205Debug] Request size: ${totalPosts} posts`);
      console.log(`[Lab205Debug] Control circles: ${request.controlCircles.length}, posts: ${controlPostsCount}`);
      console.log(`[Lab205Debug] Treatment circles: ${request.treatmentCircles.length}, posts: ${treatmentPostsCount}`);
      console.log(`[Lab205Debug] Observation circles: ${request.observationCircles?.length || 0}, posts: ${observationPostsCount}`);
    }
    
    // Create a request with caching parameters
    const requestWithCache = {
      ...request,
      labId,
      metricIndex,
      forceRefresh
    };
    
    // Using the correct API endpoint path that matches server routes
    console.log(`[MetricsAPI] Sending analysis request to API for lab ${labId || 'unknown'}`);
    
    // Add more detailed debugging for all requests
    console.log(`[MetricsAPI] Request details: metric=${request.metric.name}, circles=${request.controlCircles.length + request.treatmentCircles.length}`);
    
    // Record start time for all labs
    console.time(`metrics-analysis-lab-${labId}`);
    
    // Special handling for Lab 205
    if (labId === 205) {
      console.log(`[Lab205Debug] Starting metric analysis request for Lab 205`);
      console.time('lab205-metric-analysis');
    }
    
    try {
      // Make the API request with a timeout
      const abortController = new AbortController();
      const timeoutId = setTimeout(() => abortController.abort(), 120000);
      
      // Enhanced error handling around the API request
      const result = await apiRequest('/api/analyze-metric', 'POST', requestWithCache);
      
      // Clear timeout
      clearTimeout(timeoutId);
      
      // Record end time
      console.timeEnd(`metrics-analysis-lab-${labId}`);
      
      // Log success
      console.log(`[MetricsAPI] Successfully received response for lab ${labId || 'unknown'}`);
      
      // For Lab 205, log diagnostic information if available
      if (labId === 205) {
        console.timeEnd('lab205-metric-analysis');
        console.log(`[Lab205Debug] Received response for Lab 205:`, result);
        
        // If we received diagnostics instead of a regular result
        if (result.diagnostics) {
          console.log(`[Lab205Debug] Received diagnostic information:`, result.diagnostics);
          
          // Return a simulated result with the diagnostics data for debugging
          return {
            name: request.metric.name,
            target: request.metric.target,
            priority: request.metric.priority,
            actual: "Diagnostic Mode",
            status: "warning",
            confidence: 0,
            difference: "N/A",
            analysis: "Running in diagnostic mode. See console logs for details.",
            diagnostics: result.diagnostics
          };
        }
      }
      
      // Create base metric result
      const metricResult: MetricResult & { fromCache?: boolean; updatedAt?: string } = {
        name: request.metric.name,
        target: request.metric.target,
        priority: request.metric.priority,
        actual: result.actual,
        status: result.status,
        confidence: result.confidence,
        difference: result.difference,
        analysis: result.analysis
      };
      
      // Add cache metadata if present
      if (result.fromCache !== undefined) {
        metricResult.fromCache = result.fromCache;
      }
      
      if (result.updatedAt) {
        metricResult.updatedAt = result.updatedAt;
      }
      
      return metricResult;
    } catch (apiError: any) {
      console.error(`[MetricsAPI] Error in analyze-metric API call:`, apiError);
      
      // Special handling based on error type
      if (apiError.name === 'AbortError') {
        console.error(`[MetricsAPI] Request timed out after 2 minutes`);
        throw new Error(`Analysis request timed out after 2 minutes. The dataset may be too large.`);
      }
      
      // Special diagnostics for network errors
      if (apiError.message && apiError.message.includes('NetworkError')) {
        console.error(`[MetricsAPI] Network error detected - possible connection issue`);
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error analyzing metric:', error);
    
    // For Lab 205, provide detailed error information
    if (labId === 205) {
      console.error(`[Lab205Debug] Error analyzing metric for Lab 205:`, error);
      console.timeEnd('lab205-metric-analysis');
      
      // Return a simulated result with error information
      return {
        name: request.metric.name,
        target: request.metric.target,
        priority: request.metric.priority,
        actual: "Error",
        status: "fail",
        confidence: 0,
        difference: "N/A",
        analysis: `Error: ${error.message || 'Unknown error'}`,
        diagnostics: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    throw error;
  }
}

/**
 * Generate a recommendation with the API using caching
 * 
 * This enhanced version of generateRecommendation supports caching results in the database.
 * It returns additional metadata about the cache status including:
 * - fromCache: boolean indicating if the result was served from cache
 * - updatedAt: ISO timestamp of when the recommendation was last generated
 * 
 * The recommendation is generated based on the analysis of all metrics
 * and considers the current lab status (active/complete).
 * 
 * @param metrics The metric results to base recommendation on
 * @param labStatus The lab status ("active" or "completed")
 * @param labId Optional lab ID for caching (required for caching to work)
 * @param forceRefresh If true, ignores cached results and generates fresh recommendation
 * @returns Recommendation data with cache metadata
 */
export async function generateRecommendationWithCache(
  metrics: MetricResult[],
  labStatus: string,
  labId?: number,
  forceRefresh: boolean = false
): Promise<Recommendation & { fromCache?: boolean; updatedAt?: string; diagnostics?: any }> {
  try {
    // Special handling for Lab 205 to debug the issues
    if (labId === 205) {
      console.log(`[Lab205Debug] Starting recommendation request for Lab 205`);
      console.time('lab205-recommendation');
      
      // Log details about metrics being analyzed
      console.log(`[Lab205Debug] Analyzing ${metrics.length} metrics for recommendation`);
      console.log(`[Lab205Debug] Metrics summary:`, 
        metrics.map(m => ({ 
          name: m.name, 
          status: m.status, 
          confidence: m.confidence 
        }))
      );
    }
    
    // Using the correct API endpoint path that matches server routes
    console.log(`[MetricsAPI] Sending recommendation request to API for lab ${labId || 'unknown'}`);
    const result = await apiRequest('/api/analyze-recommendation', 'POST', {
      metrics,
      labStatus,
      labId,
      forceRefresh
    });
    
    // For Lab 205, log diagnostic information if available
    if (labId === 205) {
      console.timeEnd('lab205-recommendation');
      console.log(`[Lab205Debug] Received recommendation response for Lab 205:`, result);
      
      // If we received diagnostics instead of a regular result
      if (result.diagnostics) {
        console.log(`[Lab205Debug] Received diagnostic information:`, result.diagnostics);
        
        // Return a simulated recommendation with the diagnostics data for debugging
        return {
          decision: "wait",
          confidence: 0,
          reasoning: "Running in diagnostic mode. See console logs for details.",
          diagnostics: result.diagnostics
        };
      }
    }
    
    // Create base recommendation object
    const recommendation: Recommendation & { fromCache?: boolean; updatedAt?: string } = {
      decision: result.decision,
      confidence: result.confidence,
      reasoning: result.reasoning
    };
    
    // Add cache metadata if present
    if (result.fromCache !== undefined) {
      recommendation.fromCache = result.fromCache;
    }
    
    if (result.updatedAt) {
      recommendation.updatedAt = result.updatedAt;
    }
    
    return recommendation;
  } catch (error) {
    console.error('Error generating recommendation:', error);
    
    // For Lab 205, provide detailed error information
    if (labId === 205) {
      console.error(`[Lab205Debug] Error generating recommendation for Lab 205:`, error);
      console.timeEnd('lab205-recommendation');
      
      // Return a simulated recommendation with error information
      return {
        decision: "rethink",
        confidence: 0,
        reasoning: `Error: ${error.message || 'Unknown error'}`,
        diagnostics: {
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        }
      };
    }
    
    throw error;
  }
}

export function groupPostsByCircleRole(
  circles: LabCircle[] | undefined,
  posts: Post[] | undefined
) {
  if (!circles || !posts) {
    return {
      controlCircles: [],
      treatmentCircles: [],
      observationCircles: []
    };
  }
  
  // Ensure we're working with arrays
  const safeCircles = Array.isArray(circles) ? circles : [];
  const safePosts = Array.isArray(posts) ? posts : [];
  
  // Group circles by role
  const controlCircles = safeCircles.filter(c => c && c.role === 'control');
  const treatmentCircles = safeCircles.filter(c => c && c.role === 'treatment');
  const observationCircles = safeCircles.filter(c => c && c.role === 'observation');
  
  // Add default circles if none exist for required roles (control and treatment)
  if (controlCircles.length === 0 && safeCircles.length > 0) {
    controlCircles.push({...safeCircles[0], role: 'control'});
  }
  
  if (treatmentCircles.length === 0 && safeCircles.length > 1) {
    treatmentCircles.push({...safeCircles[1], role: 'treatment'});
  } else if (treatmentCircles.length === 0 && controlCircles.length === 0 && safeCircles.length > 0) {
    treatmentCircles.push({...safeCircles[0], role: 'treatment'});
  }
  
  // Map posts to their respective circles
  const getCirclePosts = (circleList: LabCircle[]) => {
    return circleList.map(circle => {
      const circlePosts = safePosts.filter(post => post && post.circleId === circle.id);
      
      return {
        id: circle.id,
        name: circle.name,
        posts: circlePosts
      };
    });
  };
  
  return {
    controlCircles: getCirclePosts(controlCircles),
    treatmentCircles: getCirclePosts(treatmentCircles),
    observationCircles: getCirclePosts(observationCircles)
  };
}