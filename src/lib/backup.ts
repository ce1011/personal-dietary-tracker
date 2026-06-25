import { db } from "@/db/db"
import type { BackupData, DietLog, PresetMeal, Setting } from "@/types"

const BACKUP_VERSION = 1

export async function buildBackup(): Promise<BackupData> {
  const [diet_logs, preset_meals, settings] = await Promise.all([
    db.diet_logs.toArray(),
    db.preset_meals.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: "personal-dietary-tracker",
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    diet_logs,
    preset_meals,
    settings,
  }
}

export async function exportBackup(): Promise<void> {
  const data = await buildBackup()
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `diet-tracker-backup-${data.exportedAt.slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

type ValidationIssue = { field: string; message: string }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function validateLog(raw: unknown): DietLog | ValidationIssue {
  if (!isObject(raw)) return { field: "diet_logs", message: "紀錄格式錯誤" }
  const { id, timestamp, meal_type, location, food_name, calories } = raw
  if (typeof id !== "number") return { field: "diet_logs", message: "id 必須為數字" }
  if (!(timestamp instanceof Date) && typeof timestamp !== "string")
    return { field: "diet_logs", message: "timestamp 格式錯誤" }
  if (typeof meal_type !== "string")
    return { field: "diet_logs", message: "meal_type 格式錯誤" }
  if (typeof food_name !== "string")
    return { field: "diet_logs", message: "food_name 格式錯誤" }
  if (typeof calories !== "number")
    return { field: "diet_logs", message: "calories 必須為數字" }
  return {
    id,
    timestamp: timestamp instanceof Date ? timestamp : new Date(timestamp),
    meal_type: meal_type as DietLog["meal_type"],
    location: typeof location === "string" ? location : "",
    food_name,
    calories,
  }
}

function validatePreset(raw: unknown): PresetMeal | ValidationIssue {
  if (!isObject(raw)) return { field: "preset_meals", message: "預設餐點格式錯誤" }
  const { id, meal_name, default_meal_type, default_location, calories } = raw
  if (typeof id !== "string") return { field: "preset_meals", message: "id 必須為字串" }
  if (typeof meal_name !== "string")
    return { field: "preset_meals", message: "meal_name 格式錯誤" }
  if (typeof calories !== "number")
    return { field: "preset_meals", message: "calories 必須為數字" }
  return {
    id,
    meal_name,
    calories,
    default_meal_type:
      typeof default_meal_type === "string"
        ? (default_meal_type as PresetMeal["default_meal_type"])
        : undefined,
    default_location:
      typeof default_location === "string" ? default_location : undefined,
  }
}

function validateSetting(raw: unknown): Setting | ValidationIssue {
  if (!isObject(raw)) return { field: "settings", message: "設定格式錯誤" }
  const { key, value } = raw
  if (typeof key !== "string") return { field: "settings", message: "key 必須為字串" }
  return { key, value }
}

export async function importBackup(file: File): Promise<void> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new Error("無法解析 JSON 檔案")
  }

  if (!isObject(parsed)) throw new Error("備份檔格式錯誤")
  const { diet_logs, preset_meals, settings } = parsed

  if (!Array.isArray(diet_logs)) throw new Error("備份檔缺少 diet_logs")
  if (!Array.isArray(preset_meals)) throw new Error("備份檔缺少 preset_meals")
  if (!Array.isArray(settings)) throw new Error("備份檔缺少 settings")

  const logs = diet_logs.map(validateLog)
  const badLog = logs.find((l): l is ValidationIssue => "field" in l)
  if (badLog) throw new Error((badLog as ValidationIssue).message)

  const presets = preset_meals.map(validatePreset)
  const badPreset = presets.find((p): p is ValidationIssue => "field" in p)
  if (badPreset) throw new Error((badPreset as ValidationIssue).message)

  const settingRows = settings.map(validateSetting)
  const badSetting = settingRows.find((s): s is ValidationIssue => "field" in s)
  if (badSetting) throw new Error((badSetting as ValidationIssue).message)

  await db.transaction("rw", db.diet_logs, db.preset_meals, db.settings, async () => {
    await Promise.all([
      db.diet_logs.clear(),
      db.preset_meals.clear(),
      db.settings.clear(),
    ])
    await Promise.all([
      db.diet_logs.bulkPut(logs as DietLog[]),
      db.preset_meals.bulkPut(presets as PresetMeal[]),
      db.settings.bulkPut(settingRows as Setting[]),
    ])
  })
}
