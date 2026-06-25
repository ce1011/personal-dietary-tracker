import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import type { PresetMeal } from "@/types"

export function useAllPresets(): PresetMeal[] {
  return (
    useLiveQuery(async () => {
      const presets = await db.preset_meals.toArray()
      return presets.sort((a, b) => a.meal_name.localeCompare(b.meal_name, "zh-Hant"))
    }) ?? []
  )
}

export async function addPreset(
  preset: Omit<PresetMeal, "id">
): Promise<string> {
  const id = crypto.randomUUID()
  await db.preset_meals.add({ ...preset, id })
  return id
}

export async function updatePreset(id: string, patch: Partial<PresetMeal>) {
  await db.preset_meals.update(id, patch)
}

export async function deletePreset(id: string) {
  await db.preset_meals.delete(id)
}
