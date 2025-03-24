// This file only exports the getDefaultDelay function used by the simplified form
// The main form implementation has been moved to simplified-collective-form.tsx

interface DelayRange {
  min: number;
  max: number;
}

export function getDefaultDelay(responsiveness: string): DelayRange {
  switch (responsiveness) {
    case "instant":
      return { min: 1, max: 5 };
    case "active":
      return { min: 5, max: 30 };
    case "casual":
      return { min: 30, max: 120 };
    case "zen":
      return { min: 120, max: 1440 }; // 2 hours to 24 hours
    default:
      return { min: 5, max: 30 }; // Default to active
  }
}