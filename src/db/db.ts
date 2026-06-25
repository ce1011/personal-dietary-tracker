import Dexie, { type Table } from "dexie"
import type { DietLog, PresetMeal, Setting, WeightLog } from "@/types"

export class DietTrackerDB extends Dexie {
  diet_logs!: Table<DietLog, number>
  preset_meals!: Table<PresetMeal, string>
  weight_logs!: Table<WeightLog, number>
  settings!: Table<Setting, string>

  constructor() {
    super("diet_tracker")
    this.version(1).stores({
      diet_logs: "id, timestamp, meal_type",
      preset_meals: "id, default_meal_type",
      settings: "key",
    })
    this.version(2).stores({
      weight_logs: "id, timestamp",
    })
  }
}

export const db = new DietTrackerDB()
