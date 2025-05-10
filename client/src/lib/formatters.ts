/**
 * Format metric values for display
 * @param value The value to format
 * @returns Formatted string representation of the value
 */
export const formatMetricValue = (value: any) => {
  // Handle null, undefined or non-string values
  if (value === null || value === undefined) {
    return 'N/A';
  }
  
  // Convert to string if not already a string
  const strValue = String(value);
  
  // Handle percentages
  if (typeof strValue === 'string' && strValue.endsWith && strValue.endsWith('%')) {
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
};