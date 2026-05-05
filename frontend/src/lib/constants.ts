export const DELIVERY_TIME_HOURS = 2

export const GOAL_CATEGORIES = [
  { slug: 'muscle_gain', label: 'Muscle Gain' },
  { slug: 'fat_loss', label: 'Fat Loss' },
  { slug: 'endurance', label: 'Endurance' },
  { slug: 'general_health', label: 'General Health' },
] as const

export type GoalSlug = typeof GOAL_CATEGORIES[number]['slug']
