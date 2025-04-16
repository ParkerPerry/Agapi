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
    console.log("Calling analyze-metric API with metric:", request.metric.name);
    
    // More detailed debugging
    console.log("Full request data:", {
      metricName: request.metric.name,
      metricTarget: request.metric.target,
      metricPriority: request.metric.priority,
      labGoals: request.labGoals,
      controlCircles: request.controlCircles.map(c => ({ id: c.id, name: c.name, postCount: c.posts.length })),
      treatmentCircles: request.treatmentCircles.map(c => ({ id: c.id, name: c.name, postCount: c.posts.length })),
      observationCircles: request.observationCircles?.map(c => ({ id: c.id, name: c.name, postCount: c.posts.length }))
    });
    
    // Sample a post from each type to verify content
    if (request.controlCircles.length > 0 && request.controlCircles[0].posts.length > 0) {
      console.log("Sample control post:", request.controlCircles[0].posts[0].content?.substring(0, 100));
    }
    if (request.treatmentCircles.length > 0 && request.treatmentCircles[0].posts.length > 0) {
      console.log("Sample treatment post:", request.treatmentCircles[0].posts[0].content?.substring(0, 100));
    }
    
    const result = await apiRequest('/analyze-metric', 'POST', request);
    console.log("Received analyze-metric API response:", result);
    
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
    // Create a detailed error object
    console.error('Analysis failure details:', { 
      metric: request.metric.name,
      controlCirclesCount: request.controlCircles.length,
      treatmentCirclesCount: request.treatmentCircles.length
    });
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
    console.log("Calling analyze-recommendation API with", metrics.length, "metrics and lab status:", labStatus);
    
    const result = await apiRequest('/analyze-recommendation', 'POST', {
      metrics,
      labStatus
    });
    
    console.log("Received analyze-recommendation API response:", result);
    
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
 */
export function groupPostsByCircleRole(
  circles: LabCircle[] | undefined,
  posts: Post[] | undefined
) {
  if (!circles || !posts) {
    console.log("Missing circles or posts for groupPostsByCircleRole", !!circles, !!posts);
    return {
      controlCircles: [],
      treatmentCircles: [],
      observationCircles: []
    };
  }
  
  // Log circles data for debugging
  console.log("Raw circles data:", circles.map(c => ({ id: c.id, name: c.name, role: c.role })));
  
  // Group circles by role
  const controlCircles = circles.filter(c => c.role === 'control');
  const treatmentCircles = circles.filter(c => c.role === 'treatment');
  const observationCircles = circles.filter(c => c.role === 'observation');
  
  console.log("Circle role counts:", {
    control: controlCircles.length,
    treatment: treatmentCircles.length,
    observation: observationCircles.length
  });
  
  // Add default circles if none exist for required roles (control and treatment)
  if (controlCircles.length === 0 && circles.length > 0) {
    console.log("No control circles found, using the first circle as default control");
    controlCircles.push({...circles[0], role: 'control'});
  }
  
  if (treatmentCircles.length === 0 && circles.length > 1) {
    console.log("No treatment circles found, using the second circle as default treatment");
    treatmentCircles.push({...circles[1], role: 'treatment'});
  } else if (treatmentCircles.length === 0 && controlCircles.length === 0 && circles.length > 0) {
    console.log("No treatment circles found, using the first circle as default treatment");
    treatmentCircles.push({...circles[0], role: 'treatment'});
  }
  
  // Log raw posts data for debugging
  console.log("Raw posts sample:", posts.slice(0, 2).map(p => ({ 
    id: p.id, 
    circleId: p.circleId, 
    content: p.content?.substring(0, 50)
  })));
  
  // Map posts to their respective circles
  const getCirclePosts = (circleList: LabCircle[]) => {
    return circleList.map(circle => {
      const circlePosts = posts.filter(post => post.circleId === circle.id);
      console.log(`Circle ${circle.id} (${circle.name}, role: ${circle.role}) has ${circlePosts.length} posts`);
      
      // Sample a post to verify content
      if (circlePosts.length > 0) {
        console.log(`Sample post from circle ${circle.id}:`, {
          id: circlePosts[0].id,
          content: circlePosts[0].content?.substring(0, 50)
        });
      }
      
      return {
        id: circle.id,
        name: circle.name,
        posts: circlePosts
      };
    });
  };
  
  const result = {
    controlCircles: getCirclePosts(controlCircles),
    treatmentCircles: getCirclePosts(treatmentCircles),
    observationCircles: getCirclePosts(observationCircles)
  };
  
  console.log("Grouped posts by role:", {
    controlPosts: result.controlCircles.reduce((sum, c) => sum + c.posts.length, 0),
    treatmentPosts: result.treatmentCircles.reduce((sum, c) => sum + c.posts.length, 0),
    observationPosts: result.observationCircles.reduce((sum, c) => sum + c.posts.length, 0)
  });
  
  return result;
}