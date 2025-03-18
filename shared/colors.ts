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

export interface ColoredUser {
  username: string;
  id: number;
  color: string;
}

export interface ColoredFollower {
  id: number;
  ownerId: number;
  color: string;
}

/**
 * Generates consistent colors for circle members and their followers
 */
export function generateCircleColors(members: { id: number; username: string }[]): {
  users: Map<number, string>;
  followers: Map<number, string>;
} {
  const userColors = new Map<number, string>();
  const followerColors = new Map<number, string>();
  
  // Assign unique colors to users first
  members.forEach((member, index) => {
    userColors.set(member.id, USER_COLORS[index % USER_COLORS.length]);
  });

  return {
    users: userColors,
    followers: followerColors
  };
}

/**
 * Get follower color based on owner's color
 */
export function getFollowerColor(ownerId: number, userColors: Map<number, string>): string {
  return userColors.get(ownerId) || USER_COLORS[0];
}
