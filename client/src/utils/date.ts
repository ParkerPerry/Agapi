import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = new Date(date);
  
  // Format relative time (e.g., "2h ago", "5m ago")
  const relativeTime = formatDistanceToNow(dateObj, { addSuffix: true });
  
  // For dates older than 24h, show the actual date
  if (!isToday(dateObj) && !isYesterday(dateObj)) {
    return format(dateObj, 'M/d/yyyy');
  }
  
  return relativeTime;
}
