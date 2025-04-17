import { Router } from 'express';
import { requireAuth } from './middleware';
import OpenAI from 'openai';
import { storage } from '../storage';

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

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
router.post('/analyze-metric', requireAuth, async (req, res) => {
  try {
    const { 
      metric, 
      labGoals, 
      controlCircles, 
      treatmentCircles, 
      observationCircles, 
      labId, 
      metricIndex, 
      forceRefresh = false 
    } = req.body as MetricAnalysisRequest & { 
      labId?: number; 
      metricIndex?: number; 
      forceRefresh?: boolean;
    };
    
    if (!metric || !metric.name || metric.target === undefined) {
      return res.status(400).json({ error: "Invalid metric data" });
    }
    
    if (!controlCircles || !treatmentCircles) {
      return res.status(400).json({ error: "Missing circle data" });
    }
    
    // Enhanced logging for large datasets
    const totalPosts = [...controlCircles, ...treatmentCircles].reduce(
      (count, circle) => count + (circle.posts?.length || 0), 
      0
    );
    
    console.log(`[MetricsAnalysis] Analyzing metric "${metric.name}" for lab ${labId || 'unknown'}`);
    console.log(`[MetricsAnalysis] Dataset size: ${totalPosts} posts across ${controlCircles.length + treatmentCircles.length} circles`);
    
    // Warn if dataset is unusually large
    if (totalPosts > 500) {
      console.warn(`[MetricsAnalysis] Large dataset detected: ${totalPosts} posts`);
    }

    // If labId and metricIndex are provided and forceRefresh is false, check for cached results
    if (labId && metricIndex !== undefined && !forceRefresh) {
      const cachedResults = await storage.getLabAnalysisResult(labId);
      
      if (cachedResults && 
          cachedResults.metricResults && 
          Array.isArray(cachedResults.metricResults) && 
          metricIndex < cachedResults.metricResults.length) {
        
        console.log(`[MetricsAnalysis] Using cached analysis for lab ${labId}, metric index ${metricIndex}`);
        
        return res.json({
          ...cachedResults.metricResults[metricIndex],
          fromCache: true,
          updatedAt: cachedResults.updatedAt
        });
      }
    }

    // If no cached results or forceRefresh is true, generate new analysis
    console.log(`[MetricsAnalysis] Generating new analysis for metric "${metric.name}"`);

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[MetricsAnalysis] Missing OpenAI API key");
      return res.status(500).json({ 
        error: "OpenAI API key not configured",
        message: "Please configure the OpenAI API key to use this feature"
      });
    }
    
    // Construct a summary of the circles and posts
    const controlSummary = controlCircles.map(c => {
      return `Circle ${c.id} (${c.name}): ${c.posts.length} posts`;
    }).join('\n');
    
    const treatmentSummary = treatmentCircles.map(c => {
      return `Circle ${c.id} (${c.name}): ${c.posts.length} posts`;
    }).join('\n');
    
    const observationSummary = observationCircles ? observationCircles.map(c => {
      return `Circle ${c.id} (${c.name}): ${c.posts.length} posts`;
    }).join('\n') : 'None';

    // Create a comprehensive representation of posts for each circle type
    // No longer restricting to 10 posts since we're using gpt-4.1-2025-04-14 with 1M token context
    const controlPostsSample = controlCircles
      .flatMap(c => c.posts.map(p => ({ circleId: c.id, circleName: c.name, ...p })))
      .map(p => `[Circle ${p.circleId}] ${p.content.substring(0, 500)}${p.content.length > 500 ? '...' : ''}`)
      .join('\n\n');
    
    const treatmentPostsSample = treatmentCircles
      .flatMap(c => c.posts.map(p => ({ circleId: c.id, circleName: c.name, ...p })))
      .map(p => `[Circle ${p.circleId}] ${p.content.substring(0, 500)}${p.content.length > 500 ? '...' : ''}`)
      .join('\n\n');
    
    // Construct prompt for LLM
    const prompt = `
You are an expert data analyst evaluating a social media experiment. You need to analyze the following metric:

METRIC DETAILS:
- Name: ${metric.name}
- Target: ${metric.target}
- Priority: ${metric.priority}

LAB GOALS:
${labGoals || 'No specific goals provided.'}

EXPERIMENT STRUCTURE:
- Control Circles (baseline):
${controlSummary || 'None'}

- Treatment Circles (experimental):
${treatmentSummary || 'None'}

- Observation Circles (no intervention):
${observationSummary || 'None'}

SAMPLE CONTROL GROUP CONTENT:
${controlPostsSample || 'No content available'}

SAMPLE TREATMENT GROUP CONTENT:
${treatmentPostsSample || 'No content available'}

ANALYSIS TASK:
1. Compare the control and treatment groups for the metric "${metric.name}"
2. Determine if the target "${metric.target}" was achieved based on the content
3. Provide:
   a. The actual value achieved
   b. Status: "success" (target achieved), "warning" (close to target), or "fail" (missed target)
   c. Confidence score (0-100)
   d. The difference from target (with +/- sign if numeric)
   e. A brief analysis explaining your assessment

Use your expertise to infer metrics from content patterns, engagement levels, and semantic meaning.
Provide a realistic assessment based on the available data.

FORMAT YOUR RESPONSE AS JSON:
{
  "actual": "value or description",
  "status": "success|warning|fail",
  "confidence": number between 0-100,
  "difference": "value with +/- sign if applicable",
  "analysis": "explanation with 2-3 key points"
}
`;

    // Call OpenAI API with gpt-4.1-2025-04-14 for larger context window (1M tokens)
    let completion;
    const startTime = Date.now();
    try {
      console.log(`[MetricsAnalysis] Sending request to OpenAI API with model gpt-4.1-2025-04-14`);
      
      // Create a promise that will reject after 3 minutes (as a fallback timeout)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OpenAI API request timed out after 3 minutes")), 180000);
      });
      
      // Create the OpenAI API request
      const apiRequestPromise = openai.chat.completions.create({
        model: "gpt-4.1-2025-04-14",
        messages: [
          { role: "system", content: "You are a lab metrics analyst evaluating social media experiment data." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        response_format: { type: "json_object" }
      });
      
      // Race the API request against the timeout
      completion = await Promise.race([apiRequestPromise, timeoutPromise]) as any;
      
      const duration = Date.now() - startTime;
      console.log(`[MetricsAnalysis] OpenAI API request completed in ${duration}ms`);
    } catch (apiError: any) {
      console.error(`[MetricsAnalysis] OpenAI API error:`, apiError);
      
      const duration = Date.now() - startTime;
      
      // Handle specific error types
      if (apiError.message?.includes('timeout') || duration > 175000) {
        console.error(`[MetricsAnalysis] Request likely timed out with large dataset (${totalPosts} posts)`);
        return res.status(500).json({ 
          error: "Analysis timed out",
          message: "The dataset is too large to analyze. Try reducing the number of posts or circles."
        });
      }
      
      // For other API errors
      return res.status(500).json({ 
        error: "OpenAI API error",
        message: apiError.message || "Failed to communicate with OpenAI API"
      });
    }
    
    // Parse and validate the LLM response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("Empty response from LLM");
    }
    
    try {
      const analysis = JSON.parse(responseText) as MetricAnalysisResponse;
      
      // Ensure confidence is within 0-100 range
      analysis.confidence = Math.max(0, Math.min(100, analysis.confidence));
      
      // Note: Individual metric results are cached as part of the full analysis
      // when saveLabAnalysisResult is called from the recommendation endpoint
      
      // Include timestamp for non-cached results too
      return res.json({
        ...analysis,
        fromCache: false,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      console.error("Raw response:", responseText);
      return res.status(500).json({ error: "Failed to analyze metric: Invalid response format" });
    }
  } catch (error: any) {
    console.error("Error analyzing metric:", error);
    return res.status(500).json({ 
      error: "Failed to analyze metric", 
      message: error.message || "Unknown error"
    });
  }
});

/**
 * GET /api/lab-analysis/:labId - Get cached lab analysis results
 */
router.get('/lab-analysis/:labId', requireAuth, async (req, res) => {
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
        exists: false
      });
    }
    
    // Return the cached results with fromCache flag and updatedAt timestamp
    return res.json({
      exists: true,
      metricResults: analysisResult.metricResults.map(metric => ({
        ...metric,
        fromCache: true
      })),
      recommendation: {
        ...analysisResult.recommendation,
        fromCache: true
      },
      updatedAt: analysisResult.updatedAt,
      fromCache: true
    });
  } catch (error: any) {
    console.error("Error getting lab analysis results:", error);
    return res.status(500).json({ 
      error: "Failed to get lab analysis results", 
      message: error.message || "Unknown error"
    });
  }
});

/**
 * DELETE /api/lab-analysis/:labId - Delete cached lab analysis results
 */
router.delete('/lab-analysis/:labId', requireAuth, async (req, res) => {
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
      message: error.message || "Unknown error"
    });
  }
});

/**
 * POST /api/analyze-recommendation - Generate an overall recommendation
 */
router.post('/analyze-recommendation', requireAuth, async (req, res) => {
  try {
    const { metrics, labStatus, labId, forceRefresh = false } = req.body;
    
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: "Invalid metrics data" });
    }

    // If labId is provided and forceRefresh is false, check for cached results
    if (labId && !forceRefresh) {
      const cachedResults = await storage.getLabAnalysisResult(labId);
      if (cachedResults) {
        console.log(`[MetricsAnalysis] Using cached analysis results for lab ${labId}`);
        return res.json({
          ...cachedResults.recommendation,
          fromCache: true,
          updatedAt: cachedResults.updatedAt
        });
      }
    }

    // If no cached results or force refresh requested, generate new analysis
    
    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn("[MetricsAnalysis] Missing OpenAI API key");
      return res.status(500).json({ 
        error: "OpenAI API key not configured",
        message: "Please configure the OpenAI API key to use this feature"
      });
    }
    
    // Construct prompt for LLM
    const prompt = `
You are an AI lab experiment advisor analyzing the results of an experiment.
Based on the following metrics and their performance, provide a recommendation:

${metrics.map((m: any, i: number) => 
  `METRIC ${i+1}:
   - Name: ${m.name}
   - Target: ${m.target}
   - Actual: ${m.actual}
   - Status: ${m.status}
   - Confidence: ${m.confidence}%
   - Priority: ${m.priority}
  `
).join('\n\n')}

The experiment is ${labStatus === "completed" ? 'completed' : 'still active'}.

Provide a recommendation with:
1. Decision: "go" (implement the changes), "wait" (continue collecting data), or "rethink" (reconsider approach)
2. Confidence: A number between 60-95% indicating your confidence in this recommendation
3. Reasoning: A brief explanation of your recommendation

FORMAT YOUR RESPONSE AS JSON:
{
  "decision": "go|wait|rethink",
  "confidence": number between 60-95,
  "reasoning": "explanation"
}
`;

    console.log(`[MetricsAnalysis] Generating new recommendation for ${labId ? 'lab ' + labId : 'analysis'}`);

    // Call OpenAI API with timeout handling
    let completion;
    const startTime = Date.now();
    try {
      // Create a promise that will reject after 2 minutes (recommendation is less complex, so shorter timeout)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("OpenAI API request timed out after 2 minutes")), 120000);
      });
      
      // Create the OpenAI API request
      const apiRequestPromise = openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are an experiment advisor evaluating lab metrics to generate recommendations." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      });
      
      // Race the API request against the timeout
      completion = await Promise.race([apiRequestPromise, timeoutPromise]) as any;
      
      const duration = Date.now() - startTime;
      console.log(`[MetricsAnalysis] OpenAI recommendation completed in ${duration}ms`);
    } catch (apiError) {
      console.error("[MetricsAnalysis] Error generating recommendation:", apiError);
      throw apiError; // Re-throw to be caught by the outer catch block
    }
    
    // Parse and validate the LLM response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("Empty response from LLM");
    }
    
    try {
      const recommendation = JSON.parse(responseText);
      
      // Ensure confidence is within the specified range
      recommendation.confidence = Math.max(60, Math.min(95, recommendation.confidence));
      
      // If labId is provided, save the results to the database
      if (labId) {
        const savedResult = await storage.saveLabAnalysisResult(labId, metrics, recommendation);
        console.log(`[MetricsAnalysis] Saved analysis results for lab ${labId}`);
        
        // Return with the updatedAt timestamp from the database
        return res.json({
          ...recommendation,
          fromCache: false,
          updatedAt: savedResult.updatedAt
        });
      }
      
      return res.json({
        ...recommendation,
        fromCache: false,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Failed to parse LLM response:", error);
      console.error("Raw response:", responseText);
      return res.status(500).json({ error: "Failed to generate recommendation: Invalid response format" });
    }
  } catch (error: any) {
    console.error("Error generating recommendation:", error);
    return res.status(500).json({ 
      error: "Failed to generate recommendation", 
      message: error.message || "Unknown error"
    });
  }
});

export default router;