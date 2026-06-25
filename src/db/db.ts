import Dexie, { type Table } from "dexie"
import type { DietLog, PresetMeal, Setting } from "@/types"

export class DietTrackerDB extends Dexie {
  diet_logs!: Table<DietLog, number>
  preset_meals!: Table<PresetMeal, string>
  settings!: Table<Setting, string>

  constructor() {
    super("diet_tracker")
    this.version(1).stores({
      diet_logs: "id, timestamp, meal_type",
      preset_meals: "id, default_meal_type",
      settings: "key",
    })
  }
}

export const db = new DietTrackerDB()
