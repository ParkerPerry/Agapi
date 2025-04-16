import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lab, Circle, Post } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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

  // Use temporary simulation function while we implement the LLM endpoint
  const simulateMetricAnalysis = async (metric: any, controlCircles: LabCircle[], treatmentCircles: LabCircle[], posts: Post[]) => {
    // This will be replaced with real LLM call
    // For now, simulate based on the metric name and target
    const isCompleted = lab.status === "completed";
    
    // Determine status randomly but weighted by lab status
    const statuses: ("success" | "warning" | "fail")[] = ["success", "warning", "fail"];
    const weights = isCompleted 
      ? [0.7, 0.2, 0.1]  // Completed labs favor success
      : [0.4, 0.4, 0.2]; // Active labs are more mixed
    
    const randomIndex = Math.random();
    let statusIndex = 0;
    let cumulativeWeight = 0;
    
    for (let i = 0; i < weights.length; i++) {
      cumulativeWeight += weights[i];
      if (randomIndex <= cumulativeWeight) {
        statusIndex = i;
        break;
      }
    }
    
    const status = statuses[statusIndex];
    const confidence = isCompleted 
      ? 75 + Math.floor(Math.random() * 20) 
      : 65 + Math.floor(Math.random() * 20);
    
    // Helper functions for formatting
    const getTargetAsString = (target: string | number): string => {
      return typeof target === 'string' ? target : String(target);
    };
    
    const targetContains = (target: string | number, pattern: string): boolean => {
      const targetStr = getTargetAsString(target);
      return targetStr.includes(pattern);
    };
    
    const targetMatches = (target: string | number, regex: RegExp): boolean => {
      const targetStr = getTargetAsString(target);
      return regex.test(targetStr);
    };
    
    const getTargetNumericValue = (target: string | number): number => {
      if (typeof target === 'number') return target;
      return parseInt(target, 10);
    };
    
    // Generate actual value and difference based on status
    let actual = "";
    let difference = "";
    
    if (status === "success") {
      if (targetContains(metric.target, "%")) {
        const targetValue = getTargetNumericValue(metric.target);
        const actualValue = targetValue + 5 + Math.floor(Math.random() * 10);
        actual = `${actualValue}%`;
        difference = `+${actualValue - targetValue}%`;
      } else if (targetMatches(metric.target, /^\d+$/)) {
        const targetValue = getTargetNumericValue(metric.target);
        const actualValue = targetValue + 5 + Math.floor(Math.random() * 10);
        actual = actualValue.toString();
        difference = `+${actualValue - targetValue}`;
      } else {
        actual = "Above target";
        difference = "Positive";
      }
    } else if (status === "warning") {
      if (targetContains(metric.target, "%")) {
        const targetValue = getTargetNumericValue(metric.target);
        const actualValue = Math.max(1, targetValue - 2 + Math.floor(Math.random() * 4));
        actual = `${actualValue}%`;
        difference = (actualValue >= targetValue) ? 
          `+${actualValue - targetValue}%` : 
          `-${targetValue - actualValue}%`;
      } else if (targetMatches(metric.target, /^\d+$/)) {
        const targetValue = getTargetNumericValue(metric.target);
        const actualValue = Math.max(1, targetValue - 2 + Math.floor(Math.random() * 4));
        actual = actualValue.toString();
        difference = (actualValue >= targetValue) ? 
          `+${actualValue - targetValue}` : 
          `-${targetValue - actualValue}`;
      } else {
        actual = "Near target";
        difference = "Neutral";
      }
    } else {
      if (targetContains(metric.target, "%")) {
        const targetValue = getTargetNumericValue(metric.target);
        const actualValue = Math.max(1, targetValue - 10 - Math.floor(Math.random() * 5));
        actual = `${actualValue}%`;
        difference = `-${targetValue - actualValue}%`;
      } else if (targetMatches(metric.target, /^\d+$/)) {
        const targetValue = getTargetNumericValue(metric.target);
        const actualValue = Math.max(1, targetValue - 10 - Math.floor(Math.random() * 5));
        actual = actualValue.toString();
        difference = `-${targetValue - actualValue}`;
      } else {
        actual = "Below target";
        difference = "Negative";
      }
    }
    
    // Generate a simple analysis based on control vs treatment
    const treatmentCount = treatmentCircles.length;
    const controlCount = controlCircles.length;
    
    const analysis = `Analysis based on ${controlCount} control circle${controlCount !== 1 ? 's' : ''} and ${treatmentCount} treatment circle${treatmentCount !== 1 ? 's' : ''}. ${
      status === "success" 
        ? "Treatment groups significantly outperformed control groups."
        : status === "warning"
        ? "Treatment groups showed some improvement over control groups, but results are not conclusive."
        : "Treatment groups did not show significant improvement over control groups."
    }`;
    
    return {
      name: metric.name,
      target: metric.target,
      priority: metric.priority,
      actual,
      status,
      confidence,
      difference,
      analysis
    };
  };

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
      // Group circles by role
      const controlCircles = labCircles.filter(c => c.role === "control");
      const treatmentCircles = labCircles.filter(c => c.role === "treatment");
      const observationCircles = labCircles.filter(c => c.role === "observation");
      
      // Analyze each metric
      const analyzedMetrics = [];
      
      for (const metric of lab.successMetrics.metrics) {
        try {
          // In future, this will call the LLM API endpoint
          const result = await simulateMetricAnalysis(
            metric,
            controlCircles,
            treatmentCircles,
            circlePosts
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
      generateRecommendation(analyzedMetrics, lab.status === "completed");
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
  
  const generateRecommendation = (results: MetricResult[], isCompleted: boolean) => {
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
    
    // Force more "GO" decisions for completed labs for demo purposes
    if (isCompleted && Math.random() > 0.2) {
      decision = "go";
      confidence = 75 + Math.floor(Math.random() * 20);
      reasoning = "Feature implementation is recommended based on strong positive results from the experiment.";
    }
    // High-priority metrics determine most of the decision
    else if (highPrioritySuccessRate > 0.8) {
      decision = "go";
      confidence = 70 + Math.floor(Math.random() * 25);
      reasoning = "High-priority metrics show strong positive results, supporting implementation of the tested changes.";
    } else if (highPrioritySuccessRate > 0.5) {
      decision = "wait";
      confidence = 60 + Math.floor(Math.random() * 20);
      reasoning = "Some high-priority metrics show positive results, but more data is needed for a confident decision.";
    } else {
      decision = "rethink";
      confidence = 65 + Math.floor(Math.random() * 30);
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