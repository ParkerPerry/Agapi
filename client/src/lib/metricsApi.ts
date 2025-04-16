import { apiRequest } from './queryClient';
import { MetricResult, Recommendation, LabCircle } from '@/components/labs/lab-results-analyzer';
import { Post } from "@shared/schema";

/**
 * Interface for cached lab analysis results
 */
export interface LabAnalysisResult {
  exists: boolean;
  metricResults: MetricResult[];
  recommendation: Recommendation;
  updatedAt: string;
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
 * Get cached lab analysis results
 * @param labId The lab ID to get cached results for
 * @returns Cached analysis results or null if not found
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
 * Delete cached lab analysis results to force a refresh
 * @param labId The lab ID to delete cached results for
 * @returns Success status
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
 * @param request The request data
 * @param labId Optional lab ID for caching
 * @param metricIndex Optional metric index for caching
 * @param forceRefresh Force a refresh of cached results
 * @returns MetricResult with analysis data
 */
export async function analyzeMetricWithCache(
  request: AnalyzeMetricRequest,
  labId?: number,
  metricIndex?: number,
  forceRefresh: boolean = false
): Promise<MetricResult> {
  try {
    // Create a request with caching parameters
    const requestWithCache = {
      ...request,
      labId,
      metricIndex,
      forceRefresh
    };
    
    // Using the correct API endpoint path that matches server routes
    const result = await apiRequest('/api/analyze-metric', 'POST', requestWithCache);
    
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
  } catch (error) {
    console.error('Error analyzing metric:', error);
    throw error;
  }
}

/**
 * Generate a recommendation with the API using caching
 * @param metrics The metric results
 * @param labStatus The lab status
 * @param labId Optional lab ID for caching
 * @param forceRefresh Force a refresh of cached results
 * @returns Recommendation data
 */
export async function generateRecommendationWithCache(
  metrics: MetricResult[],
  labStatus: string,
  labId?: number,
  forceRefresh: boolean = false
): Promise<Recommendation & { fromCache?: boolean; updatedAt?: string }> {
  try {
    // Using the correct API endpoint path that matches server routes
    const result = await apiRequest('/api/analyze-recommendation', 'POST', {
      metrics,
      labStatus,
      labId,
      forceRefresh
    });
    
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