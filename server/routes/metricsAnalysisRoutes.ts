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
    
    // For debugging purposes, return a temporary response
    // This allows us to verify the route works without making OpenAI API calls
    console.log("[MetricsAnalysis] Returning temporary response for debugging");
    
    return res.json({
      actual: "API integration in progress",
      status: "warning",
      confidence: 70,
      difference: "N/A",
      analysis: "The OpenAI API integration is being fixed. This is a placeholder response.",
      fromCache: false,
      updatedAt: new Date().toISOString()
    });
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
      if (cachedResults) {
        console.log(
          `[MetricsAnalysis] Using cached analysis results for lab ${labId}`,
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

    // For debugging purposes, return a temporary response
    console.log("[MetricsAnalysis] Returning temporary recommendation for debugging");
    
    const placeholderRecommendation = {
      decision: "wait",
      confidence: 70,
      reasoning: "The OpenAI API integration is being fixed. This is a placeholder recommendation.",
      fromCache: false,
      updatedAt: new Date().toISOString()
    };

    return res.json(placeholderRecommendation);
  } catch (error: any) {
    console.error("Error generating recommendation:", error);
    return res.status(500).json({
      error: "Failed to generate recommendation",
      message: error.message || "Unknown error",
    });
  }
});

export default router;