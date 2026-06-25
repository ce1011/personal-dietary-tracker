export type MealType = "早餐" | "午餐" | "晚餐" | "零食"

export interface DietLog {
  id: number
  timestamp: Date
  meal_type: MealType
  location: string
  food_name: string
  calories: number
}

export interface PresetMeal {
  id: string
  meal_name: string
  default_meal_type?: MealType
  default_location?: string
  calories: number
}

export interface Setting {
  key: string
  value: unknown
}

export interface BackupData {
  app: "personal-dietary-tracker"
  version: number
  exportedAt: string
  diet_logs: DietLog[]
  preset_meals: PresetMeal[]
  settings: Setting[]
}
