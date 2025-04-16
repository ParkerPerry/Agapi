import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Lab } from "@shared/schema";

/**
 * Interface for metric analysis results
 */
export interface MetricAnalysisResult {
  name: string;
  target: string;
  priority: "high" | "medium" | "low";
  controlValue: number;
  treatmentValue: number;
  percentChange: number;
  goalAchieved: boolean;
  confidence: number;
}

/**
 * Interface for overall recommendation
 */
export interface LabRecommendation {
  decision: "GO" | "WAIT" | "RETHINK";
  confidence: number;
  reasoning: string;
  color: "green" | "amber" | "red";
}

/**
 * Extract numeric value from metric target
 * Handles formats like ">50", "<10", "=100"
 */
function extractTargetValue(target: string): number {
  const value = target.replace(/[^0-9.]/g, "");
  return parseFloat(value);
}

/**
 * Check if a metric has met its goal
 */
function checkGoalAchievement(value: number, target: string): boolean {
  const operator = target.charAt(0);
  const targetValue = extractTargetValue(target);
  
  switch (operator) {
    case '>':
      return value > targetValue;
    case '<':
      return value < targetValue;
    case '=':
      return value === targetValue;
    case '≥':
    case '>=':
      return value >= targetValue;
    case '≤':
    case '<=':
      return value <= targetValue;
    default:
      // If no operator, assume equality
      return value === parseFloat(target);
  }
}

/**
 * Calculate confidence level for a metric
 * This is a simplified model that considers:
 * - Sample size
 * - Effect size (% change)
 * - Whether goal was achieved
 */
function calculateConfidence(
  controlSampleSize: number, 
  treatmentSampleSize: number, 
  percentChange: number,
  goalAchieved: boolean
): number {
  // Min sample size for reasonable confidence
  const minSampleSize = 5;
  
  // Base confidence based on sample sizes
  let confidence = 0;
  
  if (controlSampleSize >= minSampleSize && treatmentSampleSize >= minSampleSize) {
    // Start with 50% confidence when we have minimum sample size
    confidence = 50;
    
    // Add up to 25% based on combined sample size
    const totalSampleSize = controlSampleSize + treatmentSampleSize;
    const sampleSizeBonus = Math.min(25, totalSampleSize / 2);
    confidence += sampleSizeBonus;
    
    // Add up to 25% based on effect size (percentChange)
    const effectSizeBonus = Math.min(25, Math.abs(percentChange) / 2);
    confidence += effectSizeBonus;
  }
  
  // If goal is not achieved, cap confidence at 60%
  if (!goalAchieved && confidence > 60) {
    confidence = 60;
  }
  
  return Math.min(100, Math.round(confidence));
}

/**
 * Analyze a lab's performance based on metrics and circle data
 */
export function useLabResultsAnalysis(lab: Lab) {
  const [metricResults, setMetricResults] = useState<MetricAnalysisResult[]>([]);
  const [recommendation, setRecommendation] = useState<LabRecommendation | null>(null);

  // Fetch lab posts data
  const { data: postsData = [] } = useQuery({
    queryKey: [`/api/labs/${lab.id}/posts`],
    enabled: !!lab?.id,
  });

  // Fetch lab circles with stats
  const { data: circlesWithStats = [] } = useQuery({
    queryKey: [`/api/labs/${lab.id}/circles/stats`],
    enabled: !!lab?.id,
  });

  useEffect(() => {
    if (!lab || !postsData || !circlesWithStats || !lab.successMetrics?.metrics) {
      return;
    }

    // Process circles by role
    const controlCircles = Array.isArray(circlesWithStats) ? circlesWithStats.filter((cs: any) => 
      cs.labCircle.role === "control"
    ) : [];
    
    const treatmentCircles = Array.isArray(circlesWithStats) ? circlesWithStats.filter((cs: any) => 
      cs.labCircle.role === "treatment"
    ) : [];

    // Skip analysis if we don't have both control and treatment circles
    if (controlCircles.length === 0 || treatmentCircles.length === 0) {
      return;
    }

    // Process posts by circle
    const controlPosts = Array.isArray(postsData) ? postsData.filter((post: any) => 
      controlCircles.some((cc: any) => cc.circle.id === post.circleId)
    ) : [];
    
    const treatmentPosts = Array.isArray(postsData) ? postsData.filter((post: any) => 
      treatmentCircles.some((tc: any) => tc.circle.id === post.circleId)
    ) : [];

    // Calculate engagement metrics
    const controlEngagement = calculateEngagementMetrics(controlPosts);
    const treatmentEngagement = calculateEngagementMetrics(treatmentPosts);

    // Analyze each metric
    const results = lab.successMetrics.metrics.map(metric => {
      // Get values based on metric name
      const controlValue = getMetricValue(metric.name, controlEngagement);
      const treatmentValue = getMetricValue(metric.name, treatmentEngagement);
      
      // Calculate percent change
      const percentChange = calculatePercentChange(controlValue, treatmentValue);
      
      // Check if goal is achieved
      const goalAchieved = checkGoalAchievement(treatmentValue, metric.target);
      
      // Calculate confidence level
      const confidence = calculateConfidence(
        controlPosts.length, 
        treatmentPosts.length, 
        percentChange,
        goalAchieved
      );
      
      return {
        name: metric.name,
        target: metric.target,
        priority: metric.priority,
        controlValue,
        treatmentValue,
        percentChange,
        goalAchieved,
        confidence
      };
    });

    setMetricResults(results);
    
    // Calculate overall recommendation
    const recommendation = calculateRecommendation(results);
    setRecommendation(recommendation);
    
  }, [lab, postsData, circlesWithStats]);

  return { metricResults, recommendation };
}

/**
 * Calculate engagement metrics from posts
 */
function calculateEngagementMetrics(posts: any[]) {
  // Basic metrics
  const totalPosts = posts.length;
  let totalLikes = 0;
  let totalComments = 0;
  let totalShares = 0;
  let totalViews = 0;
  
  // Calculate totals
  posts.forEach(post => {
    // Sum up interactions if available
    if (post.interactions) {
      totalLikes += post.interactions.likeCount || 0;
      totalComments += post.interactions.commentCount || 0;
      totalShares += post.interactions.shareCount || 0;
      totalViews += post.interactions.viewCount || 0;
    }
  });
  
  // Calculate averages
  const avgLikesPerPost = totalPosts > 0 ? totalLikes / totalPosts : 0;
  const avgCommentsPerPost = totalPosts > 0 ? totalComments / totalPosts : 0;
  const avgSharesPerPost = totalPosts > 0 ? totalShares / totalPosts : 0;
  const avgViewsPerPost = totalPosts > 0 ? totalViews / totalPosts : 0;
  
  // Calculate engagement rate (likes + comments + shares) / views
  const engagementRate = totalViews > 0 
    ? ((totalLikes + totalComments + totalShares) / totalViews) * 100 
    : 0;
  
  // Calculate sentiment (placeholder - would use actual sentiment analysis)
  const sentiment = 75; // Placeholder positive sentiment (0-100)
  
  return {
    totalPosts,
    totalLikes,
    totalComments,
    totalShares,
    totalViews,
    avgLikesPerPost,
    avgCommentsPerPost,
    avgSharesPerPost,
    avgViewsPerPost,
    engagementRate,
    sentiment
  };
}

/**
 * Get specific metric value based on name
 */
function getMetricValue(metricName: string, data: any): number {
  // Map metric names to values
  const lowerName = metricName.toLowerCase();
  
  if (lowerName.includes('engagement')) {
    return data.engagementRate;
  } else if (lowerName.includes('likes') || lowerName.includes('reactions')) {
    return data.avgLikesPerPost;
  } else if (lowerName.includes('comments')) {
    return data.avgCommentsPerPost;
  } else if (lowerName.includes('shares')) {
    return data.avgSharesPerPost;
  } else if (lowerName.includes('views')) {
    return data.avgViewsPerPost;
  } else if (lowerName.includes('sentiment')) {
    return data.sentiment;
  }
  
  // Default fallback - engagement rate
  return data.engagementRate;
}

/**
 * Calculate percent change between control and treatment
 */
function calculatePercentChange(controlValue: number, treatmentValue: number): number {
  if (controlValue === 0) return treatmentValue > 0 ? 100 : 0;
  return ((treatmentValue - controlValue) / controlValue) * 100;
}

/**
 * Calculate overall recommendation based on metric results
 */
function calculateRecommendation(results: MetricAnalysisResult[]): LabRecommendation {
  // Count total and successful metrics
  const totalMetrics = results.length;
  const metricsMet = results.filter(r => r.goalAchieved).length;
  const percentMet = totalMetrics > 0 ? (metricsMet / totalMetrics) * 100 : 0;
  
  // Check high priority metrics
  const highPriorityMetrics = results.filter(r => r.priority === "high");
  const highPriorityMet = highPriorityMetrics.filter(r => r.goalAchieved).length;
  const allHighPriorityMet = highPriorityMetrics.length > 0 && 
    highPriorityMet === highPriorityMetrics.length;
  
  // Calculate average confidence across all metrics
  const avgConfidence = results.length > 0 
    ? results.reduce((sum, r) => sum + r.confidence, 0) / results.length
    : 0;
  
  // Determine recommendation
  let decision: "GO" | "WAIT" | "RETHINK" = "WAIT";
  let reasoning = "";
  let color: "green" | "amber" | "red" = "amber";
  
  if (percentMet >= 70 && allHighPriorityMet && avgConfidence > 70) {
    decision = "GO";
    color = "green";
    reasoning = `${metricsMet} out of ${totalMetrics} metrics have met their goals, including all high-priority metrics. The data suggests proceeding with the tested approach.`;
  } else if (percentMet < 40 || (highPriorityMetrics.length > 0 && highPriorityMet === 0)) {
    decision = "RETHINK";
    color = "red";
    reasoning = `Only ${metricsMet} out of ${totalMetrics} metrics have met their goals${highPriorityMet === 0 ? ', including no high-priority metrics' : ''}. Consider revising the approach based on specific metric feedback.`;
  } else {
    reasoning = `${metricsMet} out of ${totalMetrics} metrics have met their goals. More data or refinement may be needed before proceeding.`;
  }
  
  return {
    decision,
    confidence: Math.round(avgConfidence),
    reasoning,
    color
  };
}

/**
 * Format metric value for display
 */
export function formatMetricValue(value: number, metricName: string): string {
  const lowerName = metricName.toLowerCase();
  
  if (lowerName.includes('rate') || lowerName.includes('percentage')) {
    return `${value.toFixed(1)}%`;
  } else if (lowerName.includes('average') || lowerName.includes('avg')) {
    return value.toFixed(1);
  } else {
    return value.toFixed(0);
  }
}