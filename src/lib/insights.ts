import { MEAL_TYPES } from "@/lib/meal-type"
import { addDays, dateKey, startOfDay } from "@/lib/date"
import type { DietLog, MealType, WeightLog } from "@/types"

export type RangeKey = "7" | "30" | "90" | "all"

export interface DateRange {
  start: Date
  end: Date
}

export interface WeightPoint {
  date: Date
  value: number
}

export interface DayTotal {
  date: Date
  total: number | null
}

export interface MealSlice {
  type: MealType
  calories: number
  percent: number
}

export interface FoodTally {
  name: string
  calories: number
  count: number
}

export interface LocationTally {
  location: string
  calories: number
  percent: number
}

export interface WeightStats {
  delta: number
  loggedDays: number
  first: number | null
  latest: number | null
}

export interface AdherenceStats {
  adherenceRate: number
  avgDailyCalories: number
  loggedDays: number
}

export function rangeForDays(days: number): DateRange {
  const end = startOfDay(new Date())
  const start = addDays(end, -(days - 1))
  return { start, end }
}

export function rollingAverageWeight(logs: WeightLog[]): WeightPoint[] {
  if (logs.length < 2) return []
  const sorted = [...logs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )
  const points: WeightPoint[] = []
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const windowStart = startOfDay(addDays(current.timestamp, -6))
    const inWindow = sorted.filter(
      (log) => log.timestamp >= windowStart && log.timestamp <= current.timestamp
    )
    const avg =
      inWindow.reduce((sum, log) => sum + log.weight, 0) / inWindow.length
    points.push({ date: current.timestamp, value: avg })
  }
  return points
}

export function weightStats(logs: WeightLog[]): WeightStats {
  if (logs.length === 0) {
    return { delta: 0, loggedDays: 0, first: null, latest: null }
  }
  const sorted = [...logs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )
  const days = new Set(sorted.map((log) => dateKey(log.timestamp))).size
  const first = sorted[0].weight
  const latest = sorted[sorted.length - 1].weight
  return {
    delta: first - latest,
    loggedDays: days,
    first,
    latest,
  }
}

export function dailyCalorieTotals(
  logs: DietLog[],
  range: DateRange
): DayTotal[] {
  const byDay = new Map<string, number>()
  for (const log of logs) {
    const key = dateKey(log.timestamp)
    byDay.set(key, (byDay.get(key) ?? 0) + log.calories)
  }
  const result: DayTotal[] = []
  const cursor = startOfDay(range.start)
  const end = startOfDay(range.end)
  while (cursor <= end) {
    const key = dateKey(cursor)
    result.push({ date: new Date(cursor), total: byDay.get(key) ?? null })
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

export function adherenceStats(
  totals: DayTotal[],
  goal: number
): AdherenceStats {
  const logged = totals.filter(
    (day): day is DayTotal & { total: number } => day.total !== null
  )
  if (logged.length === 0) {
    return { adherenceRate: 0, avgDailyCalories: 0, loggedDays: 0 }
  }
  const onTarget = logged.filter((day) => day.total <= goal).length
  const sum = logged.reduce((acc, day) => acc + day.total, 0)
  return {
    adherenceRate: (onTarget / logged.length) * 100,
    avgDailyCalories: sum / logged.length,
    loggedDays: logged.length,
  }
}

export function mealDistribution(logs: DietLog[]): MealSlice[] {
  const total = logs.reduce((sum, log) => sum + log.calories, 0)
  return MEAL_TYPES.map((type) => {
    const calories = logs
      .filter((log) => log.meal_type === type)
      .reduce((sum, log) => sum + log.calories, 0)
    return {
      type,
      calories,
      percent: total > 0 ? (calories / total) * 100 : 0,
    }
  })
}

export function topFoods(logs: DietLog[], n: number): FoodTally[] {
  const map = new Map<string, { calories: number; count: number }>()
  for (const log of logs) {
    const entry = map.get(log.food_name) ?? { calories: 0, count: 0 }
    entry.calories += log.calories
    entry.count += 1
    map.set(log.food_name, entry)
  }
  return [...map.entries()]
    .map(([name, value]) => ({ name, ...value }))
    .sort((a, b) => b.calories - a.calories)
    .slice(0, n)
}

export function topLocations(logs: DietLog[]): LocationTally[] {
  const withLocation = logs.filter((log) => log.location.trim() !== "")
  const total = withLocation.reduce((sum, log) => sum + log.calories, 0)
  const map = new Map<string, number>()
  for (const log of withLocation) {
    map.set(log.location, (map.get(log.location) ?? 0) + log.calories)
  }
  return [...map.entries()]
    .map(([location, calories]) => ({
      location,
      calories,
      percent: total > 0 ? (calories / total) * 100 : 0,
    }))
    .sort((a, b) => b.calories - a.calories)
}
