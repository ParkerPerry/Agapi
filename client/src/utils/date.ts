import { format, formatDistanceToNow, parseISO } from "date-fns";

/**
 * Format a date relative to the current time
 * e.g., "2 hours ago", "5 days ago", etc.
 */
export function formatRelativeTime(date: string | Date): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(parsedDate, { addSuffix: true });
}

/**
 * Format a date with a specific format pattern
 */
export function formatDate(date: string | Date, pattern: string = "PPP"): string {
  const parsedDate = typeof date === "string" ? parseISO(date) : date;
  return format(parsedDate, pattern);
}

/**
 * Format date as "Month day, year"
 */
export function formatLongDate(date: string | Date): string {
  return formatDate(date, "MMMM d, yyyy");
}

/**
 * Format date and time as "Month day, year at h:mm a"
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, "MMMM d, yyyy 'at' h:mm a");
}

/**
 * Format time as "h:mm a"
 */
export function formatTime(date: string | Date): string {
  return formatDate(date, "h:mm a");
}

/**
 * Format date in a simple readable format: "MMM d, yyyy"
 * e.g., "Jan 5, 2025"
 */
export function formatSimpleDate(date: string | Date): string {
  return formatDate(date, "MMM d, yyyy");
}