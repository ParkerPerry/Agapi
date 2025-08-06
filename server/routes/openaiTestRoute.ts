import express from "express";
import { openai } from "../openai";

const router = express.Router();

/**
 * Test endpoint to verify OpenAI connectivity with minimal parameters
 * GET /api/test-openai
 */
router.get("/test-openai", async (req, res) => {
  try {
    console.log("[OpenAI-Test] Starting test with timestamp:", new Date().toISOString());
    console.log("[OpenAI-Test] Checking if OPENAI_API_KEY is defined:", Boolean(process.env.OPENAI_API_KEY));
    
    // Create a very simple minimal API request to test connectivity
    console.log("[OpenAI-Test] Creating minimal OpenAI request");
    
    try {
      const startTime = Date.now();
      
      // Use a 30 second timeout to avoid hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error("OpenAI test request timed out after 30 seconds"));
        }, 30000);
      });
      
      // Create the simplest possible API request
      const apiRequestPromise = openai.chat.completions.create({
        model: "gpt-4o-mini", // Using the correct model for faster response
        messages: [
          { role: "system", content: "You are a simple test assistant." },
          { role: "user", content: "Reply with JSON: {\"status\": \"success\"}" }
        ],
        temperature: 0,
        response_format: { type: "json_object" },
        max_tokens: 20 // Keeping response very small
      });
      
      // Race the API request against the timeout
      console.log("[OpenAI-Test] Awaiting response or timeout");
      const completion = await Promise.race([apiRequestPromise, timeoutPromise]);
      
      const duration = Date.now() - startTime;
      console.log(`[OpenAI-Test] Request completed in ${duration}ms`);
      
      // Extract just what we need from the response
      const minimizedResponse = {
        id: completion.id,
        model: completion.model,
        choices: completion.choices?.map(c => ({ content: c.message.content })),
        duration_ms: duration
      };
      
      console.log("[OpenAI-Test] Successful test, returning result");
      return res.json({
        success: true,
        status: "OpenAI API connection working",
        response: minimizedResponse
      });
    } catch (error: any) {
      console.error("[OpenAI-Test] Error during API call:", error);
      console.error("[OpenAI-Test] Error message:", error.message);
      
      // Check if error is from timeout
      if (error.message?.includes("timed out")) {
        return res.status(504).json({
          success: false, 
          status: "Timeout exceeded",
          error: error.message
        });
      }
      
      return res.status(500).json({
        success: false,
        status: "API call failed",
        error: error.message || "Unknown error"
      });
    }
  } catch (error: any) {
    console.error("[OpenAI-Test] Unexpected error:", error);
    return res.status(500).json({
      success: false,
      status: "Test failed",
      error: error.message || "Unknown error"
    });
  }
});

export default router;