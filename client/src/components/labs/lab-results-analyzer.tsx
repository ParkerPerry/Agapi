import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lab, Circle, Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { analyzeMetric, generateRecommendation as apiGenerateRecommendation, groupPostsByCircleRole } from "@/lib/metricsApi";

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

// Format metric values for display
export function formatMetricValue(value: any) {
  // Handle null, undefined or non-string values
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  // Convert to string if not already a string
  const strValue = String(value);
  
  // Handle percentages
  if (strValue.endsWith('%')) {
    return strValue;
  }
  
  // Handle numbers
  const num = parseFloat(strValue);
  if (!isNaN(num)) {
    // Format large numbers with commas
    return num.toLocaleString();
  }
  
  // Return as-is for non-numeric values
  return strValue;
}

// Type for recommendation
export interface Recommendation {
  decision: "go" | "wait" | "rethink";
  confidence: number;
  reasoning: string;
}

/**
 * Hook that analyzes lab metrics and generates results and recommendations
 */
export function useLabResultsAnalysis(lab: Lab) {
  const { toast } = useToast();
  const [metricResults, setMetricResults] = useState<MetricResult[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<Error | null>(null);

  // Fetch lab circles data
  const { 
    data: labCircles, 
    isLoading: isCirclesLoading,
    error: circlesError
  } = useQuery<LabCircle[]>({
    queryKey: [`/api/labs/${lab?.id}/circles`],
    enabled: !!lab?.id && (lab.status === "active" || lab.status === "completed")
  });

  // Fetch circle posts data for all circles in the lab
  const {
    data: circlePosts,
    isLoading: isPostsLoading,
    error: postsError
  } = useQuery<Post[]>({
    queryKey: [`/api/labs/${lab?.id}/posts`],
    enabled: !!lab?.id && (lab.status === "active" || lab.status === "completed") && !!labCircles && labCircles.length > 0
  });

  // Main analysis function
  const analyzeLabMetrics = async () => {
    if (!lab?.successMetrics?.metrics || lab.successMetrics.metrics.length === 0) {
      setMetricResults([]);
      setRecommendation(null);
      return;
    }

    // Don't proceed if we're missing circle or post data
    if (!labCircles || !circlePosts) {
      return;
    }
    
    setIsAnalyzing(true);
    setAnalyzeError(null);
    
    try {
      // Group the circles and posts by role
      const { controlCircles, treatmentCircles, observationCircles } = groupPostsByCircleRole(labCircles, circlePosts);
      
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
          
          // Call the API endpoint for analysis
          const result = await analyzeMetric(requestData);
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
          const recommendation = await apiGenerateRecommendation(
            analyzedMetrics,
            lab.status
          );
          setRecommendation(recommendation);
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
      setIsAnalyzing(false);
    }
  };

  // Trigger analysis when lab, circles, or posts data changes
  useEffect(() => {
    if (circlesError || postsError) {
      setAnalyzeError(
        circlesError instanceof Error ? circlesError : 
        postsError instanceof Error ? postsError : 
        new Error('Failed to load lab data')
      );
      return;
    }
    
    if (!isCirclesLoading && !isPostsLoading) {
      analyzeLabMetrics();
    }
  }, [lab, labCircles, circlePosts, isCirclesLoading, isPostsLoading, circlesError, postsError]);
  
  const generateFallbackRecommendation = (results: MetricResult[]) => {
    if (!results || results.length === 0) {
      setRecommendation(null);
      return;
    }
    
    // Count success, warning, and fail metrics by priority
    const counts = {
      high: { success: 0, warning: 0, fail: 0, total: 0 },
      medium: { success: 0, warning: 0, fail: 0, total: 0 },
      low: { success: 0, warning: 0, fail: 0, total: 0 }
    };
    
    results.forEach(result => {
      counts[result.priority][result.status]++;
      counts[result.priority].total++;
    });
    
    // Decision logic based on priority success rates
    let decision: "go" | "wait" | "rethink";
    let confidence = 0;
    let reasoning = "";
    
    // Calculate overall success percentage
    const highPrioritySuccessRate = counts.high.total > 0 ? 
      (counts.high.success + counts.high.warning * 0.5) / counts.high.total : 1;
    
    const mediumPrioritySuccessRate = counts.medium.total > 0 ? 
      (counts.medium.success + counts.medium.warning * 0.5) / counts.medium.total : 1;
    
    // Determine decision based on success rates
    const isCompleted = lab.status === "completed";
    
    if (isCompleted && highPrioritySuccessRate > 0.6) {
      decision = "go";
      confidence = 75 + Math.floor(Math.random() * 20);
      reasoning = "Feature implementation is recommended based on positive results from the experiment.";
    } else if (highPrioritySuccessRate > 0.8) {
      decision = "go";
      confidence = 70 + Math.floor(Math.random() * 25);
      reasoning = "High-priority metrics show strong positive results, supporting implementation of the tested changes.";
    } else if (highPrioritySuccessRate > 0.5) {
      decision = "wait";
      confidence = 60 + Math.floor(Math.random() * 20);
      reasoning = "Some high-priority metrics show positive results, but more data is needed for a confident decision.";
    } else {
      decision = "rethink";
      confidence = 65 + Math.floor(Math.random() * 25);
      reasoning = "High-priority metrics failed to meet targets. Consider revising the approach or testing new alternatives.";
    }
    
    // Adjust confidence based on medium priority metrics
    if (counts.medium.total > 0 && mediumPrioritySuccessRate > 0.7) {
      confidence = Math.min(95, confidence + 5);
      reasoning += " Medium-priority metrics also show promising results.";
    } else if (counts.medium.total > 0 && mediumPrioritySuccessRate < 0.3) {
      confidence = Math.max(60, confidence - 5);
      reasoning += " However, medium-priority metrics underperformed.";
    }
    
    setRecommendation({
      decision,
      confidence,
      reasoning: reasoning.trim()
    });
  };
  
  // Function to retry analysis if it fails
  const retryAnalysis = () => {
    setAnalyzeError(null);
    analyzeLabMetrics();
  };

  return { 
    metricResults, 
    recommendation, 
    isAnalyzing, 
    analyzeError, 
    retryAnalysis 
  };
}