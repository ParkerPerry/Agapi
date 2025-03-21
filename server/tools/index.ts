/**
 * Tool Manager for AI Followers
 * 
 * This module manages all available tools that can be used by AI followers.
 */

import { AiFollower } from '@shared/schema';
import { calculatorTool } from './calculator';

// Define the structure of an AI tool
export interface AITool {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  execute: (input: string) => any;
}

// Available tools definition
const availableTools: AITool[] = [
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Performs mathematical calculations',
    enabled: false,
    execute: calculatorTool
  },
  // Add other tools here as they are implemented
];

/**
 * Gets all available tools that can be equipped by AI followers
 */
export function getAvailableTools(): Omit<AITool, 'execute'>[] {
  // Return the tools without the execute function
  return availableTools.map(({ id, name, description, enabled }) => ({
    id,
    name, 
    description,
    enabled
  }));
}

/**
 * Checks if an AI follower has a specific tool equipped and enabled
 */
export function hasToolEnabled(follower: AiFollower, toolId: string): boolean {
  if (!follower.tools || !follower.tools.equipped) {
    return false;
  }

  const tool = follower.tools.equipped.find(t => t.id === toolId);
  return !!tool && tool.enabled;
}

/**
 * Executes a specific tool for an AI follower
 */
export function executeTool(toolId: string, input: string): any {
  const tool = availableTools.find(t => t.id === toolId);
  
  if (!tool) {
    throw new Error(`Tool with ID "${toolId}" not found`);
  }
  
  return tool.execute(input);
}

/**
 * Finds all arithmetic expressions in a string and evaluates them using the calculator tool
 * Format: [calc: expression] or [calculate: expression]
 */
export function processCalculatorExpressions(text: string): string {
  const calcRegex = /\[(calc|calculate):([^\]]+)\]/gi;
  
  let processedText = text;
  
  // Process calculator expressions
  processedText = processedText.replace(calcRegex, (match, _, expression) => {
    try {
      console.log(`[Calculator] Processing expression: ${expression.trim()}`);
      const result = calculatorTool(expression.trim());
      
      if (result.error) {
        console.log(`[Calculator] Error: ${result.error}`);
        return `[Calculator Error: ${result.error}]`;
      }
      
      console.log(`[Calculator] Result: ${result.result}`);
      return `${result.result.toString()}`;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.log(`[Calculator] Exception: ${errorMsg}`);
      return `[Calculator Error: ${errorMsg}]`;
    }
  });
  
  return processedText;
}

/**
 * Structure to track tool usage
 */
export interface ToolUsageResult {
  processedText: string;
  toolsUsed: {
    used: boolean;
    tools: {
      id: string;
      name: string;
      usageCount: number;
      examples: string[];
    }[];
  };
}

/**
 * Processes text to apply all enabled tools for a follower
 * Returns both the processed text and information about which tools were used
 */
export function processTextWithTools(text: string, follower: AiFollower): ToolUsageResult {
  let processedText = text;
  const toolsUsed: ToolUsageResult['toolsUsed'] = {
    used: false,
    tools: []
  };
  
  // Apply calculator tool if enabled
  if (hasToolEnabled(follower, 'calculator')) {
    // Create regex patterns to find calculator expressions
    // Standard format for explicit calculator tool usage
    const calcRegex = /\[(calc|calculate):([^\]]+)\]/gi;
    
    // Also look for potential math expressions we could auto-process
    const mathExpressionRegex = /(?:result is|answer is|equals|=)\s*([\d+\-*/()^%\s.]+)(?:\s*$|\s*\.)/gi;
    
    // Collect all matches into an array manually to avoid TypeScript iteration issue
    const calculatorMatches: RegExpExecArray[] = [];
    let match;
    while ((match = calcRegex.exec(text)) !== null) {
      calculatorMatches.push(match);
    }

    // Auto-process implicit math expressions if we're a math helper
    if (follower.personality.toLowerCase().includes('math') && calculatorMatches.length === 0) {
      let mathMatch;
      let potentialExpressions = [];
      while ((mathMatch = mathExpressionRegex.exec(text)) !== null) {
        if (mathMatch[1] && mathMatch[1].trim()) {
          potentialExpressions.push(mathMatch[1].trim());
        }
      }
      
      // Log potential auto-processing
      if (potentialExpressions.length > 0) {
        console.log(`[Tools] Found ${potentialExpressions.length} potential math expressions to auto-process`);
        
        // For math helpers, we'll wrap these in calculator tags and process them
        for (const expr of potentialExpressions) {
          // Only auto-process if it looks like a math expression (contains operators)
          if (/[+\-*/^%()]/.test(expr)) {
            // Add calculator tags around the expression
            const replacement = `[calc:${expr}]`;
            // Replace the expression with calculator tags
            processedText = processedText.replace(
              new RegExp(`(result is|answer is|equals|=)\\s*(${expr.replace(/([+\-*/^%()])/g, '\\$1')})`, 'i'),
              `$1 ${replacement}`
            );
            
            // Add to our matches for tracking
            calculatorMatches.push([replacement, 'calc', expr] as any);
          }
        }
      }
    }
    
    if (calculatorMatches.length > 0) {
      // Record calculator tool usage
      toolsUsed.used = true;
      
      // Track examples of calculator usage (up to 3)
      const examples = calculatorMatches
        .slice(0, 3)
        .map(match => match[0]);
      
      toolsUsed.tools.push({
        id: 'calculator',
        name: 'Calculator',
        usageCount: calculatorMatches.length,
        examples
      });
      
      // Apply tool
      processedText = processCalculatorExpressions(processedText);
      
      console.log(`[Tools] Processed ${calculatorMatches.length} calculator expressions`);
    }
  }
  
  // Add other tool processing here as needed
  
  return {
    processedText,
    toolsUsed
  };
}