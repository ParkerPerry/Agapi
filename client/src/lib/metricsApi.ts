import { apiRequest } from './queryClient';
import { MetricResult, Recommendation, LabCircle } from '@/components/labs/lab-results-analyzer';
import { Post } from "@shared/schema";

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
 * Helper function to group posts by circle role
 * IMPORTANT: All console.log statements removed to prevent infinite logs
 */
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