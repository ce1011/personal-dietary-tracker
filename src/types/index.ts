export type MealType = "早餐" | "午餐" | "晚餐" | "零食"

export interface DietLog {
  id: number
  timestamp: Date
  meal_type: MealType
  location: string
  food_name: string
  calories: number
  quantity?: number
  serving_unit?: string
}

export interface PresetMeal {
  id: string
  meal_name: string
  default_meal_type?: MealType
  default_location?: string
  calories: number
  serving_unit?: string
}

export interface Setting {
  key: string
  value: unknown
}

export interface WeightLog {
  id: number
  timestamp: Date
  weight: number
}

export type Sex = "male" | "female"

export type ActivityLevel = "sedentary" | "light" | "moderate" | "active"

export interface Profile {
  height: number
  age: number
  sex: Sex
  activity: ActivityLevel
  deficit: number
}

export interface BackupData {
  app: "personal-dietary-tracker"
  version: number
  exportedAt: string
  diet_logs: DietLog[]
  preset_meals: PresetMeal[]
  weight_logs: WeightLog[]
  settings: Setting[]
}
