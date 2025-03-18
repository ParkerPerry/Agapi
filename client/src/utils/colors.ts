// Generate a consistent color for a user based on their username
export function generateUserColor(username: string): string {
  const colors = [
    "#2563eb", // blue
    "#dc2626", // red
    "#16a34a", // green
    "#9333ea", // purple
    "#ea580c", // orange
    "#0891b2", // cyan
    "#be185d", // pink
  ];

  // More sophisticated hash function to ensure better distribution
  const hash = username
    .split('')
    .reduce((acc, char, i) => 
      char.charCodeAt(0) * (i + 1) + acc, 0
    );
  
  return colors[Math.abs(hash) % colors.length];
}
