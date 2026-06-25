import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import type { Profile } from "@/types"

const DEFAULT_DAILY_GOAL = 2000

export function useDailyCalorieGoal(): [number, (goal: number) => Promise<void>] {
  const goal =
    useLiveQuery(async () => {
      const row = await db.settings.get("dailyCalorieGoal")
      return row?.value as number | undefined
    }) ?? DEFAULT_DAILY_GOAL

  const setGoal = async (value: number) => {
    await db.settings.put({ key: "dailyCalorieGoal", value })
  }

  return [goal, setGoal]
}

export function useProfile(): [Profile | null, (profile: Profile) => Promise<void>] {
  const profile =
    useLiveQuery(async () => {
      const row = await db.settings.get("profile")
      return (row?.value as Profile | undefined) ?? null
    }) ?? null

  const setProfile = async (value: Profile) => {
    await db.settings.put({ key: "profile", value })
  }

  return [profile, setProfile]
}

export { DEFAULT_DAILY_GOAL }
