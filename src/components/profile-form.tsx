import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProfile } from "@/hooks/use-settings"
import { useLatestWeight } from "@/hooks/use-weight-logs"
import {
  ACTIVITY_LEVELS,
  DEFICIT_OPTIONS,
  SEX_OPTIONS,
  computeGoal,
} from "@/lib/calorie-goal"
import type { ActivityLevel, Profile, Sex } from "@/types"

const EMPTY = ""

interface ProfileFormValues {
  height: string
  age: string
  sex: string
  activity: string
  deficit: string
  targetWeight: string
}

export function ProfileForm() {
  const [profile, setProfile] = useProfile()
  const latest = useLatestWeight()
  const [values, setValues] = useState<ProfileFormValues>({
    height: "",
    age: "",
    sex: EMPTY,
    activity: EMPTY,
    deficit: EMPTY,
    targetWeight: "",
  })
  const [errors, setErrors] = useState<{
    height?: string
    age?: string
    sex?: string
    activity?: string
    deficit?: string
  }>({})

  useEffect(() => {
    setValues({
      height: profile?.height ? String(profile.height) : "",
      age: profile?.age ? String(profile.age) : "",
      sex: profile?.sex ?? EMPTY,
      activity: profile?.activity ?? EMPTY,
      deficit: profile?.deficit ? String(profile.deficit) : EMPTY,
      targetWeight: profile?.targetWeight ? String(profile.targetWeight) : "",
    })
    setErrors({})
  }, [profile])

  const isFilled =
    !!values.height &&
    !!values.age &&
    values.sex !== EMPTY &&
    values.activity !== EMPTY &&
    values.deficit !== EMPTY

  const preview = useMemo(() => {
    if (!isFilled || !latest) return null
    const built = buildProfile(values)
    if (!built) return null
    return computeGoal(built, latest.weight)
  }, [isFilled, latest, values])

  function update<K extends keyof ProfileFormValues>(
    key: K,
    value: ProfileFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    const h = Number(values.height)
    if (!values.height.trim() || Number.isNaN(h) || h <= 0)
      next.height = "請輸入大於 0 的身高"
    const a = Number(values.age)
    if (!values.age.trim() || Number.isNaN(a) || a <= 0)
      next.age = "請輸入大於 0 的年齡"
    if (values.sex === EMPTY) next.sex = "請選擇性別"
    if (values.activity === EMPTY) next.activity = "請選擇活動量"
    if (values.deficit === EMPTY) next.deficit = "請選擇減脂強度"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const built = buildProfile(values)
    if (!built) return
    try {
      await setProfile(built)
      toast.success("已儲存身體資料")
    } catch {
      toast.error("儲存失敗，請稍後再試")
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
      <CardHeader>
        <CardTitle>身體資料與減脂目標</CardTitle>
        <CardDescription>
          填寫一次即可。紀錄體重時可依此自動計算每日卡路里目標。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <Field data-invalid={!!errors.height}>
              <FieldLabel htmlFor="profile-height">身高 (cm)</FieldLabel>
              <Input
                id="profile-height"
                type="number"
                inputMode="numeric"
                placeholder="如：170"
                className="h-12 rounded-2xl"
                value={values.height}
                aria-invalid={!!errors.height}
                onChange={(e) => update("height", e.target.value)}
              />
              {errors.height && <FieldError>{errors.height}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.age}>
              <FieldLabel htmlFor="profile-age">年齡 (歲)</FieldLabel>
              <Input
                id="profile-age"
                type="number"
                inputMode="numeric"
                placeholder="如：30"
                className="h-12 rounded-2xl"
                value={values.age}
                aria-invalid={!!errors.age}
                onChange={(e) => update("age", e.target.value)}
              />
              {errors.age && <FieldError>{errors.age}</FieldError>}
            </Field>
          </div>

          <Field data-invalid={!!errors.sex}>
            <FieldLabel>性別</FieldLabel>
            <Select
              value={values.sex}
              onValueChange={(v) => update("sex", v)}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                {SEX_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sex && <FieldError>{errors.sex}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.activity}>
            <FieldLabel>活動量</FieldLabel>
            <Select
              value={values.activity}
              onValueChange={(v) => update("activity", v)}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_LEVELS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {opt.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.activity && <FieldError>{errors.activity}</FieldError>}
          </Field>

          <Field data-invalid={!!errors.deficit}>
            <FieldLabel>減脂強度</FieldLabel>
            <Select
              value={values.deficit}
              onValueChange={(v) => update("deficit", v)}
            >
              <SelectTrigger className="h-12 w-full rounded-2xl">
                <SelectValue placeholder="請選擇" />
              </SelectTrigger>
              <SelectContent>
                {DEFICIT_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={String(opt.value)}>
                    <div className="flex flex-col">
                      <span>
                        {opt.label}（−{opt.value} kcal）
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {opt.desc}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.deficit && <FieldError>{errors.deficit}</FieldError>}
          </Field>

          <Field>
            <FieldLabel htmlFor="profile-target-weight">
              目標體重 (kg)（選填）
            </FieldLabel>
            <Input
              id="profile-target-weight"
              type="number"
              inputMode="numeric"
              placeholder="如：65"
              className="h-12 rounded-2xl"
              value={values.targetWeight}
              onChange={(e) => update("targetWeight", e.target.value)}
            />
            <FieldDescription className="text-xs">
              設定後，統計頁的體重趨勢圖會顯示目標線。
            </FieldDescription>
          </Field>

          {preview && (
            <div className="flex flex-col gap-1.5 rounded-2xl bg-muted/60 p-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  依最新體重 {latest?.weight} kg 試算
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-foreground/80">每日目標</span>
                <span className="font-heading text-lg font-semibold tabular-nums text-primary">
                  {Math.round(preview.goal)} kcal
                </span>
              </div>
              <FieldDescription className="text-xs">
                BMR {Math.round(preview.bmr)} · TDEE {Math.round(preview.tdee)}
                {preview.atFloor ? " · 已達 BMR 安全底線" : ""}
              </FieldDescription>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            className="h-12 rounded-2xl px-6"
          >
            儲存身體資料
          </Button>
        </FieldGroup>
      </CardContent>
    </Card>
  )
}

function buildProfile(values: ProfileFormValues): Profile | null {
  const height = Number(values.height)
  const age = Number(values.age)
  const deficit = Number(values.deficit)
  if (
    Number.isNaN(height) ||
    Number.isNaN(age) ||
    Number.isNaN(deficit) ||
    values.sex === EMPTY ||
    values.activity === EMPTY
  ) {
    return null
  }
  const targetWeight =
    values.targetWeight.trim() === "" || Number.isNaN(Number(values.targetWeight))
      ? undefined
      : Number(values.targetWeight)
  return {
    height,
    age,
    sex: values.sex as Sex,
    activity: values.activity as ActivityLevel,
    deficit,
    ...(targetWeight !== undefined ? { targetWeight } : {}),
  }
}
