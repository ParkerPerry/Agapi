// Shared color utilities between frontend and backend

export const USER_COLORS = [
  "#2563eb", // blue
  "#dc2626", // red  
  "#16a34a", // green
  "#9333ea", // purple
  "#ea580c", // orange
  "#0891b2", // cyan
  "#be185d", // pink
] as const;

/**
 * Generates a consistent color for a user based on their username
 * This is shared between frontend and backend to ensure consistency
 */
export function generateUserColor(username: string): string {
  // Use position-weighted character codes for better distribution
  const hash = username
    .split('')
    .reduce((acc, char, i) => 
      char.charCodeAt(0) * (i + 1) + acc, 0
    );

  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

/**
 * Type-safe interface for user color associations
 */
export interface ColoredUser {
  username: string;
  color: string;
}

/**
 * Creates a consistent color mapping for a set of users
 */
export function createUserColorMap(usernames: string[]): Map<string, string> {
  return new Map(
    usernames.map(username => [username, generateUserColor(username)])
  );
}
