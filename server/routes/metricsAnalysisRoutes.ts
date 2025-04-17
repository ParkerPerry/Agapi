import { Router } from "express";
import { requireAuth } from "./middleware";
import { storage } from "../storage";
import OpenAI from "openai";
import { openai } from "../openai";

const router = Router();

// Log that we're using the imported OpenAI instance
console.log("[MetricsAnalysis] Using imported OpenAI instance");

/**
 * Interface for metric analysis request
 */
interface MetricAnalysisRequest {
  metric: {
    name: string;
    target: string | number;
    priority: "high" | "medium" | "low";
  };
  labGoals: string;
  controlCircles: Array<{
    id: number;
    name: string;
    posts: Array<{
      content: string;
      createdAt: string;
      metrics?: any;
    }>;
  }>;
  treatmentCircles: Array<{
    id: number;
    name: string;
    posts: Array<{
      content: string;
      createdAt: string;
      metrics?: any;
    }>;
  }>;
  observationCircles?: Array<{
    id: number;
    name: string;
    posts: Array<{
      content: string;
      createdAt: string;
      metrics?: any;
    }>;
  }>;
}

/**
 * Interface for metric analysis response
 */
interface MetricAnalysisResponse {
  actual: string;
  status: "success" | "warning" | "fail";
  confidence: number;
  difference: string;
  analysis: string;
}

/**
 * POST /api/analyze-metric - Analyze a metric against lab data
 */
router.post("/analyze-metric", requireAuth, async (req, res) => {
  try {
    console.log("[MetricsAnalysis] Request received for metric analysis");
    
    const {
      metric,
      labGoals,
      controlCircles,
      treatmentCircles,
      observationCircles,
      metricIndex,
      forceRefresh = false,
    } = req.body as MetricAnalysisRequest & {
      labId?: number;
      metricIndex?: number;
      forceRefresh?: boolean;
    };
    
    // Extract labId from request body
    const labId = req.body.labId;
    
    // Basic validation
    if (!metric || !metric.name || metric.target === undefined) {
      return res.status(400).json({ error: "Invalid metric data" });
    }

    if (!controlCircles || !treatmentCircles) {
      return res.status(400).json({ error: "Missing circle data" });
    }

    // If labId and metricIndex are provided and forceRefresh is false, check for cached results
    if (labId && metricIndex !== undefined && !forceRefresh) {
      const cachedResults = await storage.getLabAnalysisResult(labId);

      if (
        cachedResults &&
        cachedResults.metricResults &&
        Array.isArray(cachedResults.metricResults) &&
        metricIndex < cachedResults.metricResults.length
      ) {
        console.log(
          `[MetricsAnalysis] Using cached analysis for lab ${labId}, metric index ${metricIndex}`,
        );

        return res.json({
          ...cachedResults.metricResults[metricIndex],
          fromCache: true,
          updatedAt: cachedResults.updatedAt,
        });
      }
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[MetricsAnalysis] Missing OpenAI API key");
      return res.status(500).json({
        error: "OpenAI API key not configured",
        message: "Please configure the OpenAI API key to use this feature",
      });
    }
    
    try {
      console.log(`[MetricsAnalysis] Preparing OpenAI request for metric analysis: ${metric.name}`);
      
      // Process data for OpenAI analysis
      
      // Format control circle data for prompt
      const controlCirclesSummary = controlCircles.map(circle => {
        const postCount = circle.posts.length;
        return `Control Circle "${circle.name}" (ID: ${circle.id}) with ${postCount} posts`;
      }).join("\n");
      
      // Format treatment circle data for prompt
      const treatmentCirclesSummary = treatmentCircles.map(circle => {
        const postCount = circle.posts.length;
        return `Treatment Circle "${circle.name}" (ID: ${circle.id}) with ${postCount} posts`;
      }).join("\n");
      
      // Sample post content for context
      const samplePosts = [];
      
      // Add sample posts from control circles
      for (const circle of controlCircles) {
        for (const post of circle.posts.slice(0, 2)) { // Just take 2 posts per circle for sampling
          samplePosts.push(`Control post from "${circle.name}": "${post.content.substring(0, 100)}..."`);
        }
      }
      
      // Add sample posts from treatment circles
      for (const circle of treatmentCircles) {
        for (const post of circle.posts.slice(0, 2)) { // Just take 2 posts per circle for sampling
          samplePosts.push(`Treatment post from "${circle.name}": "${post.content.substring(0, 100)}..."`);
        }
      }
      
      const postSamples = samplePosts.slice(0, 10).join("\n"); // Limit to 10 samples
      
      // Create the prompt for OpenAI
      const openAIAnalysisPrompt = `
      You are a metrics analysis expert tasked with analyzing experimental data from a lab.
      
      LAB DETAILS:
      Lab Goals: ${labGoals || "No specific goals provided"}
      
      METRIC TO ANALYZE:
      Name: ${metric.name}
      Target: ${metric.target}
      Priority: ${metric.priority}
      
      EXPERIMENTAL SETUP:
      Control Circles:
      ${controlCirclesSummary}
      
      Treatment Circles:
      ${treatmentCirclesSummary}
      
      SAMPLE POST CONTENT:
      ${postSamples}
      
      ANALYSIS TASK:
      1. Compare the control and treatment groups based on the metric: ${metric.name}
      2. Determine the actual performance level of the metric (high, medium, low, or a specific value)
      3. Determine the status (success, warning, fail) based on how it compares to the target
      4. Estimate a numerical confidence level (0-100)
      5. Calculate the approximate difference between control and treatment (e.g., "+15%", "-5%")
      6. Provide a detailed analysis of the results
      
      Your response must be in JSON format with the following structure:
      {
        "actual": "actual performance level (high/medium/low or specific value)",
        "status": "success/warning/fail",
        "confidence": 75, // numerical value between 0-100
        "difference": "+15%", // estimated difference between control and treatment
        "analysis": "Detailed analysis of the metric performance and implications"
      }
      `;
      
      // Make request to OpenAI
      console.log("[MetricsAnalysis] Sending request to OpenAI");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini-2025-04-14", // Using mini model for metrics analysis
        messages: [
          {
            role: "system", 
            content: "You are a metrics analysis expert that evaluates experimental data and produces concise, insightful analysis in JSON format."
          },
          {
            role: "user",
            content: openAIAnalysisPrompt
          }
        ],
        response_format: { type: "json_object" },
      });
      
      if (!response.choices[0].message.content) {
        throw new Error("Empty response from OpenAI");
      }
      
      console.log("[MetricsAnalysis] Received response from OpenAI");
      
      // Parse the OpenAI response
      const analysisResult = JSON.parse(response.choices[0].message.content);
      
      // Add metadata to the response
      const result = {
        ...analysisResult,
        fromCache: false,
        updatedAt: new Date().toISOString()
      };
      
      // If labId is provided, cache the results
      if (labId !== undefined && metricIndex !== undefined) {
        try {
          // Get existing results or create new structure
          const existingResults = await storage.getLabAnalysisResult(labId) || {
            labId,
            metricResults: [],
            recommendation: null,
            updatedAt: new Date().toISOString()
          };
          
          // Update the specific metric result
          if (existingResults.metricResults.length <= metricIndex) {
            // Extend the array if needed
            while (existingResults.metricResults.length < metricIndex) {
              existingResults.metricResults.push({} as any);
            }
            existingResults.metricResults.push(result);
          } else {
            // Update existing entry
            existingResults.metricResults[metricIndex] = result;
          }
          
          existingResults.updatedAt = new Date().toISOString();
          
          // Save updated results
          await storage.saveLabAnalysisResult(labId, existingResults);
          console.log(`[MetricsAnalysis] Cached results for lab ${labId}, metric index ${metricIndex}`);
        } catch (cacheError) {
          console.error("Error caching analysis results:", cacheError);
          // Continue even if caching fails
        }
      }
      
      return res.json(result);
    } catch (openaiError: any) {
      console.error("Error with OpenAI analysis:", openaiError);
      
      // Return a fallback response for OpenAI API errors
      return res.status(500).json({
        error: "OpenAI API error",
        message: openaiError.message || "Error generating analysis with OpenAI",
        details: openaiError.response?.data || null
      });
    }
  } catch (error: any) {
    console.error("Error in metric analysis endpoint:", error);
    return res.status(500).json({
      error: "Failed to process metric analysis request",
      message: error.message || "Unknown error",
    });
  }
});

/**
 * GET /api/lab-analysis/:labId - Get cached lab analysis results
 */
router.get("/lab-analysis/:labId", requireAuth, async (req, res) => {
  try {
    const labId = parseInt(req.params.labId);

    if (isNaN(labId)) {
      return res.status(400).json({ error: "Invalid lab ID" });
    }

    // Get cached analysis results
    const analysisResult = await storage.getLabAnalysisResult(labId);

    if (!analysisResult) {
      return res.status(404).json({
        message: "No analysis results found for this lab",
        exists: false,
      });
    }

    // Return the cached results with fromCache flag and updatedAt timestamp
    return res.json({
      exists: true,
      metricResults: analysisResult.metricResults.map((metric) => ({
        ...metric,
        fromCache: true,
      })),
      recommendation: {
        ...analysisResult.recommendation,
        fromCache: true,
      },
      updatedAt: analysisResult.updatedAt,
      fromCache: true,
    });
  } catch (error: any) {
    console.error("Error getting lab analysis results:", error);
    return res.status(500).json({
      error: "Failed to get lab analysis results",
      message: error.message || "Unknown error",
    });
  }
});

/**
 * DELETE /api/lab-analysis/:labId - Delete cached lab analysis results
 */
router.delete("/lab-analysis/:labId", requireAuth, async (req, res) => {
  try {
    const labId = parseInt(req.params.labId);

    if (isNaN(labId)) {
      return res.status(400).json({ error: "Invalid lab ID" });
    }

    // Delete cached analysis results
    await storage.deleteLabAnalysisResult(labId);

    return res.json({ message: "Analysis results deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting lab analysis results:", error);
    return res.status(500).json({
      error: "Failed to delete lab analysis results",
      message: error.message || "Unknown error",
    });
  }
});

/**
 * POST /api/analyze-recommendation - Generate an overall recommendation
 */
router.post("/analyze-recommendation", requireAuth, async (req, res) => {
  try {
    const { metrics, labStatus, labId, forceRefresh = false } = req.body;

    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: "Invalid metrics data" });
    }

    // If labId is provided and forceRefresh is false, check for cached results
    if (labId && !forceRefresh) {
      const cachedResults = await storage.getLabAnalysisResult(labId);
      if (cachedResults && cachedResults.recommendation) {
        console.log(
          `[MetricsAnalysis] Using cached recommendation for lab ${labId}`,
        );
        return res.json({
          ...cachedResults.recommendation,
          fromCache: true,
          updatedAt: cachedResults.updatedAt,
        });
      }
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[MetricsAnalysis] Missing OpenAI API key");
      return res.status(500).json({
        error: "OpenAI API key not configured",
        message: "Please configure the OpenAI API key to use this feature",
      });
    }

    try {
      console.log(`[MetricsAnalysis] Preparing OpenAI request for recommendation analysis`);
      
      // Format metrics summary for the prompt
      const metricsSummary = metrics.map(metric => {
        return `Metric: ${metric.name}
Target: ${metric.target}
Priority: ${metric.priority}
Actual: ${metric.actual}
Status: ${metric.status}
Confidence: ${metric.confidence}%
Difference: ${metric.difference}`;
      }).join("\n\n");
      
      // Format analysis summary for additional context
      const analysisPoints = metrics.map(metric => {
        // Truncate long analysis to keep prompt size reasonable
        const truncatedAnalysis = metric.analysis && metric.analysis.length > 300 
          ? metric.analysis.substring(0, 300) + "..." 
          : metric.analysis || "No analysis available";
        
        return `${metric.name} Analysis: ${truncatedAnalysis}`;
      }).join("\n\n");
      
      // Create the prompt for OpenAI
      const openAIPrompt = `
      You are a lab experiment advisor tasked with providing a recommendation based on multiple metric analyses.
      
      LAB STATUS: ${labStatus || "unknown"}
      
      METRICS SUMMARY:
      ${metricsSummary}
      
      DETAILED ANALYSIS:
      ${analysisPoints}
      
      RECOMMENDATION TASK:
      Based on the metrics data provided above, determine whether the lab experiment should:
      1. "proceed" - Deploy the treatment to all users
      2. "wait" - Continue collecting data before making a decision
      3. "revert" - Return to the control version and discontinue the treatment
      
      Your response must be in JSON format with the following structure:
      {
        "decision": "proceed/wait/revert",
        "confidence": 75, // numerical value between 0-100
        "reasoning": "Detailed explanation of your recommendation and reasoning"
      }
      `;
      
      // Make request to OpenAI
      console.log("[MetricsAnalysis] Sending recommendation request to OpenAI");
      
      const response = await openai.chat.completions.create({
        model: "gpt-4.1-mini-2025-04-14",
        messages: [
          {
            role: "system", 
            content: "You are a lab experiment advisor that provides clear recommendations based on metric analyses."
          },
          {
            role: "user",
            content: openAIPrompt
          }
        ],
        response_format: { type: "json_object" },
      });
      
      if (!response.choices[0].message.content) {
        throw new Error("Empty response from OpenAI");
      }
      
      console.log("[MetricsAnalysis] Received recommendation from OpenAI");
      
      // Parse the OpenAI response
      const recommendationResult = JSON.parse(response.choices[0].message.content);
      
      // Add metadata to the response
      const result = {
        ...recommendationResult,
        fromCache: false,
        updatedAt: new Date().toISOString()
      };
      
      // If labId is provided, cache the results
      if (labId) {
        try {
          // Get existing results or create new structure
          const existingResults = await storage.getLabAnalysisResult(labId) || {
            labId,
            metricResults: [],
            recommendation: null,
            updatedAt: new Date().toISOString()
          };
          
          // Update the recommendation
          existingResults.recommendation = result;
          existingResults.updatedAt = new Date().toISOString();
          
          // Save updated results
          await storage.saveLabAnalysisResult(labId, existingResults);
          console.log(`[MetricsAnalysis] Cached recommendation for lab ${labId}`);
        } catch (cacheError) {
          console.error("Error caching recommendation:", cacheError);
          // Continue even if caching fails
        }
      }
      
      return res.json(result);
    } catch (openaiError: any) {
      console.error("Error with OpenAI recommendation:", openaiError);
      
      // Return a fallback response for OpenAI API errors
      return res.status(500).json({
        error: "OpenAI API error",
        message: openaiError.message || "Error generating recommendation with OpenAI",
        details: openaiError.response?.data || null
      });
    }
  } catch (error: any) {
    console.error("Error generating recommendation:", error);
    return res.status(500).json({
      error: "Failed to generate recommendation",
      message: error.message || "Unknown error",
    });
  }
});

export default router;