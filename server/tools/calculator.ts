/**
 * Calculator Tool for AI Followers
 * 
 * This tool allows AI followers to perform mathematical calculations.
 */

interface CalculationResult {
  result: number;
  expression: string;
  steps?: string[];
  error?: string;
}

/**
 * Evaluates a mathematical expression safely
 * 
 * @param expression The mathematical expression to evaluate
 * @returns The result of the calculation
 */
export function calculate(expression: string): CalculationResult {
  try {
    // Clean and standardize the expression
    const sanitizedExpression = sanitizeExpression(expression);
    
    // Parse and validate the expression
    validateExpression(sanitizedExpression);
    
    // Evaluate the expression safely (without using eval)
    const result = evaluateExpression(sanitizedExpression);
    
    // Format the result
    return {
      result,
      expression: sanitizedExpression,
    };
  } catch (error) {
    return {
      result: NaN,
      expression,
      error: error instanceof Error ? error.message : 'Unknown calculation error'
    };
  }
}

/**
 * Sanitizes a mathematical expression to make it safer to evaluate
 */
function sanitizeExpression(expression: string): string {
  // Remove all spaces
  let sanitized = expression.replace(/\s+/g, '');
  
  // Replace common math notations with JavaScript operators
  sanitized = sanitized.replace(/×/g, '*').replace(/÷/g, '/');
  
  // Replace power notation
  sanitized = sanitized.replace(/\^/g, '**');
  
  return sanitized;
}

/**
 * Validates an expression to ensure it only contains allowed mathematical operations
 */
function validateExpression(expression: string): void {
  // Allow only numbers, operators, parentheses, and decimal points
  const validPattern = /^[0-9+\-*/().%^]*$/;
  
  if (!validPattern.test(expression)) {
    throw new Error('Expression contains invalid characters');
  }
  
  // Check for balanced parentheses
  const parenStack = [];
  for (const char of expression) {
    if (char === '(') {
      parenStack.push(char);
    } else if (char === ')') {
      if (parenStack.length === 0) {
        throw new Error('Unbalanced parentheses');
      }
      parenStack.pop();
    }
  }
  
  if (parenStack.length > 0) {
    throw new Error('Unbalanced parentheses');
  }
}

/**
 * Safely evaluates a mathematical expression without using eval()
 */
function evaluateExpression(expression: string): number {
  // This is a simplified implementation using Function constructor
  // which is safer than eval() but still needs the sanitization and validation
  try {
    // Create a function that will evaluate our expression
    const calculator = new Function(`return ${expression}`);
    const result = calculator();
    
    // Check that the result is a valid number
    if (typeof result !== 'number' || isNaN(result) || !isFinite(result)) {
      throw new Error('Calculation resulted in an invalid number');
    }
    
    return result;
  } catch (error) {
    throw new Error('Error evaluating expression: ' + (error instanceof Error ? error.message : 'unknown error'));
  }
}

/**
 * Main calculator tool function that can be called by AI followers
 */
export function calculatorTool(input: string): CalculationResult {
  return calculate(input);
}