export const MEMBER_COLORS = [
  '#2DB89A', // Emerald Teal
  '#E85D75', // Rose Pink
  '#8B5CF6', // Vivid Purple
  '#4F6EF7', // Royal Blue
  '#EF9F27', // Amber Orange
  '#F43F5E', // Rose Red
  '#06B6D4', // Cyan
  '#F59E0B', // Amber
  '#10B981', // Emerald
]

/**
 * Generates a consistent color for a given ID (userId or memberId)
 * ensuring that the same user always gets the same color throughout the app.
 */
export function getMemberColor(id: string) {
  if (!id) return MEMBER_COLORS[0]
  
  // Create a simple hash from the string
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  
  // Use a salt to ensure a better distribution and change existing assignments
  const index = Math.abs(hash + 7) % MEMBER_COLORS.length
  return MEMBER_COLORS[index]
}

/**
 * Returns a subtle version of the member color for backgrounds/borders
 */
export function getMemberSubtleStyles(id: string) {
  const color = getMemberColor(id)
  return {
    backgroundColor: `${color}1A`, // 10% opacity hex
    color: color,
    borderColor: `${color}33`, // 20% opacity hex
  }
}
