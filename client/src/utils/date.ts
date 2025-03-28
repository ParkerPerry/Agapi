/**
 * Format a date into a relative time string (e.g., "3 days ago", "just now")
 * @param date Date to format
 * @returns Formatted relative time string
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Convert to seconds
  const seconds = Math.floor(diff / 1000);
  
  // Less than a minute
  if (seconds < 60) {
    return "just now";
  }
  
  // Less than an hour
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }
  
  // Less than a day
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }
  
  // Less than a week
  if (seconds < 604800) {
    const days = Math.floor(seconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }
  
  // Less than a month
  if (seconds < 2592000) {
    const weeks = Math.floor(seconds / 604800);
    return `${weeks} ${weeks === 1 ? "week" : "weeks"} ago`;
  }
  
  // Less than a year
  if (seconds < 31536000) {
    const months = Math.floor(seconds / 2592000);
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }
  
  // More than a year
  const years = Math.floor(seconds / 31536000);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
}

/**
 * Format a date to a standard format (e.g. "Mar 12, 2025")
 * @param date Date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  };
  
  return date.toLocaleDateString('en-US', options);
}

/**
 * Format a date to include time (e.g. "Mar 12, 2025, 3:45 PM")
 * @param date Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  
  return date.toLocaleDateString('en-US', options);
}