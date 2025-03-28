import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";

/**
 * Format a date relative to now (e.g., "5 minutes ago", "2 days ago")
 */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    if (isToday(dateObj)) {
      return `Today at ${format(dateObj, "h:mm a")}`;
    } else if (isYesterday(dateObj)) {
      return `Yesterday at ${format(dateObj, "h:mm a")}`;
    } else {
      return formatDistanceToNow(dateObj, { addSuffix: true });
    }
  } catch (error) {
    return "Unknown time";
  }
}

/**
 * Format a date in a simple readable format (Jun 15, 2023 @ 3:45 PM)
 */
export function formatSimpleDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    return format(dateObj, "MMM d, yyyy @ h:mm a");
  } catch (error) {
    return "Unknown date";
  }
}

/**
 * Format a date for display in tables or lists (Jun 15, 2023)
 */
export function formatShortDate(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    return format(dateObj, "MMM d, yyyy");
  } catch (error) {
    return "Unknown date";
  }
}

/**
 * Format a time for display (3:45 PM)
 */
export function formatTime(date: string | Date): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  
  try {
    return format(dateObj, "h:mm a");
  } catch (error) {
    return "Unknown time";
  }
}

/**
 * Format a date range for display (Jun 15 - Jun 20, 2023)
 */
export function formatDateRange(startDate: string | Date, endDate: string | Date): string {
  const startObj = typeof startDate === "string" ? new Date(startDate) : startDate;
  const endObj = typeof endDate === "string" ? new Date(endDate) : endDate;
  
  try {
    const sameYear = startObj.getFullYear() === endObj.getFullYear();
    const sameMonth = startObj.getMonth() === endObj.getMonth();
    
    if (sameYear && sameMonth) {
      return `${format(startObj, "MMM d")} - ${format(endObj, "d, yyyy")}`;
    } else if (sameYear) {
      return `${format(startObj, "MMM d")} - ${format(endObj, "MMM d, yyyy")}`;
    } else {
      return `${format(startObj, "MMM d, yyyy")} - ${format(endObj, "MMM d, yyyy")}`;
    }
  } catch (error) {
    return "Unknown date range";
  }
}