import { useState, useEffect } from "react";
import { Lab } from "@shared/schema";

// Type definitions for metric results
export interface MetricResult {
  name: string;
  target: string;
  priority: "high" | "medium" | "low";
  actual: string;
  status: "success" | "warning" | "fail";
  confidence: number;
  difference: string;
}

// Format metric values for display
export function formatMetricValue(value: string) {
  // Handle percentages
  if (value.endsWith('%')) {
    return value;
  }
  
  // Handle numbers
  const num = parseFloat(value);
  if (!isNaN(num)) {
    // Format large numbers with commas
    return num.toLocaleString();
  }
  
  // Return as-is for non-numeric values
  return value;
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
  const [metricResults, setMetricResults] = useState<MetricResult[]>([]);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  
  useEffect(() => {
    // Skip analysis if lab does not have success metrics
    if (!lab?.successMetrics?.metrics || lab.successMetrics.metrics.length === 0) {
      setMetricResults([]);
      setRecommendation(null);
      return;
    }
    
    // For demonstration, generate synthetic results based on lab status
    // In a real implementation, this would be replaced with actual data from backend API
    const isCompleted = lab.status === "completed";
    const simulatedResults: MetricResult[] = lab.successMetrics.metrics.map((metric, index) => {
      // Generate different results based on the metric and lab status
      const statuses: ("success" | "warning" | "fail")[] = ["success", "warning", "fail"];
      const randomStatus = isCompleted 
        ? (index % 3 === 0 ? "warning" : "success") // Completed labs mostly show success
        : statuses[Math.floor(Math.random() * statuses.length)]; // Random for active labs
      
      // Generate a confidence level between 65% and 95%
      const confidence = isCompleted 
        ? 75 + Math.floor(Math.random() * 20) // Higher confidence for completed
        : 65 + Math.floor(Math.random() * 20); // Lower confidence for active
        
      // Simulate different results based on the status
      let actual = "";
      let difference = "";
      
      if (randomStatus === "success") {
        // Example: if target is "10% increase", actual might be "15% increase"
        if (metric.target.includes && metric.target.includes("%")) {
          const targetValue = parseInt(metric.target, 10);
          const actualValue = targetValue + 5 + Math.floor(Math.random() * 10);
          actual = `${actualValue}%`;
          difference = `+${actualValue - targetValue}%`;
        } else if (metric.target.match && metric.target.match(/^\d+$/)) {
          // For numeric targets
          const targetValue = parseInt(metric.target, 10);
          const actualValue = targetValue + 5 + Math.floor(Math.random() * 10);
          actual = actualValue.toString();
          difference = `+${actualValue - targetValue}`;
        } else {
          // For other targets
          actual = "Above target";
          difference = "Positive";
        }
      } else if (randomStatus === "warning") {
        // Close to target but not quite there
        if (metric.target.includes && metric.target.includes("%")) {
          const targetValue = parseInt(metric.target, 10);
          const actualValue = Math.max(1, targetValue - 2 + Math.floor(Math.random() * 4));
          actual = `${actualValue}%`;
          difference = (actualValue >= targetValue) ? 
            `+${actualValue - targetValue}%` : 
            `-${targetValue - actualValue}%`;
        } else if (metric.target.match && metric.target.match(/^\d+$/)) {
          const targetValue = parseInt(metric.target, 10);
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
        // Failed to meet target
        if (metric.target.includes && metric.target.includes("%")) {
          const targetValue = parseInt(metric.target, 10);
          const actualValue = Math.max(1, targetValue - 10 - Math.floor(Math.random() * 5));
          actual = `${actualValue}%`;
          difference = `-${targetValue - actualValue}%`;
        } else if (metric.target.match && metric.target.match(/^\d+$/)) {
          const targetValue = parseInt(metric.target, 10);
          const actualValue = Math.max(1, targetValue - 10 - Math.floor(Math.random() * 5));
          actual = actualValue.toString();
          difference = `-${targetValue - actualValue}`;
        } else {
          actual = "Below target";
          difference = "Negative";
        }
      }
      
      return {
        name: metric.name,
        target: metric.target,
        priority: metric.priority,
        actual,
        status: randomStatus,
        confidence,
        difference
      };
    });
    
    setMetricResults(simulatedResults);
    
    // Generate an overall recommendation based on the results
    generateRecommendation(simulatedResults, isCompleted);
  }, [lab]);
  
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
  
  return { metricResults, recommendation };
}