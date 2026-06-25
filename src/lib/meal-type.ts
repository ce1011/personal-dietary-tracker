import type { MealType } from "@/types"

export const MEAL_TYPES: MealType[] = ["早餐", "午餐", "晚餐", "零食"]

const MEAL_RANGES: Array<{ type: MealType; start: number; end: number }> = [
  { type: "早餐", start: 5, end: 10 },
  { type: "午餐", start: 11, end: 13 },
  { type: "晚餐", start: 17, end: 20 },
]

export function detectMealType(date: Date = new Date()): MealType {
  const hour = date.getHours()
  for (const range of MEAL_RANGES) {
    if (hour >= range.start && hour <= range.end) {
      return range.type
    }
  }
  return "零食"
}
