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
router.post('/analyze-metric', async (req, res) => {
  try {
    const { metric, labGoals, controlCircles, treatmentCircles, observationCircles } = req.body as MetricAnalysisRequest;
    
    if (!metric || !metric.name || metric.target === undefined) {
      return res.status(400).json({ error: "Invalid metric data" });
    }
    
    if (!controlCircles || !treatmentCircles) {
      return res.status(400).json({ error: "Missing circle data" });
    }

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

    // Create a concise representation of posts for each circle type
    const controlPostsSample = controlCircles
      .flatMap(c => c.posts.map(p => ({ circleId: c.id, circleName: c.name, ...p })))
      .slice(0, 10) // Limit to first 10 posts to avoid token limits
      .map(p => `[Circle ${p.circleId}] ${p.content.substring(0, 200)}${p.content.length > 200 ? '...' : ''}`)
      .join('\n\n');
    
    const treatmentPostsSample = treatmentCircles
      .flatMap(c => c.posts.map(p => ({ circleId: c.id, circleName: c.name, ...p })))
      .slice(0, 10)
      .map(p => `[Circle ${p.circleId}] ${p.content.substring(0, 200)}${p.content.length > 200 ? '...' : ''}`)
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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a lab metrics analyst evaluating social media experiment data." },
        { role: "user", content: prompt }
      ],
      temperature: 0.4,
      response_format: { type: "json_object" }
    });
    
    // Parse and validate the LLM response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("Empty response from LLM");
    }
    
    try {
      const analysis = JSON.parse(responseText) as MetricAnalysisResponse;
      
      // Ensure confidence is within 0-100 range
      analysis.confidence = Math.max(0, Math.min(100, analysis.confidence));
      
      return res.json(analysis);
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
 * POST /api/analyze-recommendation - Generate an overall recommendation
 */
router.post('/analyze-recommendation', async (req, res) => {
  try {
    const { metrics, labStatus } = req.body;
    
    if (!metrics || !Array.isArray(metrics) || metrics.length === 0) {
      return res.status(400).json({ error: "Invalid metrics data" });
    }

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

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an experiment advisor evaluating lab metrics to generate recommendations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });
    
    // Parse and validate the LLM response
    const responseText = completion.choices[0].message.content;
    if (!responseText) {
      throw new Error("Empty response from LLM");
    }
    
    try {
      const recommendation = JSON.parse(responseText);
      
      // Ensure confidence is within the specified range
      recommendation.confidence = Math.max(60, Math.min(95, recommendation.confidence));
      
      return res.json(recommendation);
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