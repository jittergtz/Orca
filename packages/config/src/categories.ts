export const BROAD_CATEGORIES = [
  'AI', 'Finance', 'Sport', 'Technology', 'Science',
  'Geopolitics', 'Health', 'Energy', 'Crypto', 'Entertainment'
] as const

export type BroadCategory = typeof BROAD_CATEGORIES[number]
