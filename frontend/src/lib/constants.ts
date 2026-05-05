export const DELIVERY_TIME_HOURS = 2

export const GOAL_CATEGORIES = [
  { slug: 'muscle-gain', label: 'Muscle Gain' },
  { slug: 'weight-loss', label: 'Weight Loss' },
  { slug: 'endurance', label: 'Endurance' },
  { slug: 'recovery', label: 'Recovery' },
] as const

export type GoalCategory = typeof GOAL_CATEGORIES[number]['slug']
