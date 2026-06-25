import type { ActivityLevel, Profile, Sex } from "@/types"

export const SEX_OPTIONS = [
  { value: "male", label: "男性" },
  { value: "female", label: "女性" },
] as const

export const ACTIVITY_LEVELS = [
  {
    value: "sedentary",
    label: "久坐不動",
    desc: "辦公室工作、極少運動",
    factor: 1.2,
  },
  {
    value: "light",
    label: "輕度活動",
    desc: "每週輕鬆運動 1-3 天",
    factor: 1.375,
  },
  {
    value: "moderate",
    label: "中度活動",
    desc: "每週中強度運動 3-5 天",
    factor: 1.55,
  },
  {
    value: "active",
    label: "高度活動",
    desc: "每週高強度運動 6-7 天",
    factor: 1.725,
  },
] as const

export const DEFICIT_OPTIONS = [
  { value: 300, label: "溫和減脂", desc: "容易堅持，不易流失肌肉" },
  { value: 500, label: "標準減脂", desc: "最常見的設定" },
] as const

export function activityFactor(level: ActivityLevel): number {
  return ACTIVITY_LEVELS.find((a) => a.value === level)?.factor ?? 1.2
}

export function activityLabel(level: ActivityLevel): string {
  return ACTIVITY_LEVELS.find((a) => a.value === level)?.label ?? ""
}

export function deficitLabel(deficit: number): string {
  return DEFICIT_OPTIONS.find((d) => d.value === deficit)?.label ?? ""
}

/**
 * Mifflin-St Jeor 基礎代謝率公式。
 */
export function computeBMR(
  weight: number,
  height: number,
  age: number,
  sex: Sex
): number {
  const base = 10 * weight + 6.25 * height - 5 * age
  return sex === "male" ? base + 5 : base - 161
}

/**
 * 總熱量消耗 = BMR × 活動量因子。
 */
export function computeTDEE(bmr: number, activity: ActivityLevel): number {
  return bmr * activityFactor(activity)
}

export interface GoalBreakdown {
  bmr: number
  tdee: number
  deficit: number
  rawGoal: number
  goal: number
  atFloor: boolean
}

/**
 * 每日減脂目標熱量 = TDEE − 熱量赤字。
 * 安全底線：每日攝取不低於 BMR。
 */
export function computeGoal(profile: Profile, weight: number): GoalBreakdown {
  const bmr = computeBMR(weight, profile.height, profile.age, profile.sex)
  const tdee = computeTDEE(bmr, profile.activity)
  const rawGoal = tdee - profile.deficit
  const goal = Math.max(rawGoal, bmr)
  return {
    bmr,
    tdee,
    deficit: profile.deficit,
    rawGoal,
    goal,
    atFloor: rawGoal < bmr,
  }
}

export function isProfileComplete(profile: Profile | null): profile is Profile {
  return (
    !!profile &&
    profile.height > 0 &&
    profile.age > 0 &&
    (profile.sex === "male" || profile.sex === "female") &&
    ACTIVITY_LEVELS.some((a) => a.value === profile.activity) &&
    DEFICIT_OPTIONS.some((d) => d.value === profile.deficit)
  )
}
