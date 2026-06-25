import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { addWeight } from "@/hooks/use-weight-logs"
import { useDailyCalorieGoal, useProfile } from "@/hooks/use-settings"
import { computeGoal, isProfileComplete } from "@/lib/calorie-goal"
import type { WeightLog } from "@/types"

interface WeightFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultWeight?: WeightLog
}

export function WeightForm({ open, onOpenChange, defaultWeight }: WeightFormProps) {
  const [profile] = useProfile()
  const [, setGoal] = useDailyCalorieGoal()
  const [weight, setWeight] = useState("")
  const [updateGoal, setUpdateGoal] = useState(true)
  const [error, setError] = useState<string | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setWeight(defaultWeight ? String(defaultWeight.weight) : "")
    setUpdateGoal(true)
    setError(undefined)
  }, [open, defaultWeight])

  const profileReady = isProfileComplete(profile)

  const preview = useMemo(() => {
    if (!profileReady) return null
    const w = Number(weight)
    if (!weight.trim() || Number.isNaN(w) || w <= 0) return null
    return computeGoal(profile, w)
  }, [profileReady, profile, weight])

  const canUpdateGoal = profileReady && updateGoal

  async function handleSubmit() {
    const w = Number(weight)
    if (!weight.trim() || Number.isNaN(w) || w <= 0) {
      setError("請輸入大於 0 的體重")
      return
    }
    try {
      await addWeight(w)
      if (canUpdateGoal && profile) {
        const rounded = Math.round(computeGoal(profile, w).goal)
        await setGoal(rounded)
        toast.success(`已紀錄體重，每日目標更新為 ${rounded} kcal`)
      } else {
        toast.success("已紀錄體重")
      }
      onOpenChange(false)
    } catch {
      toast.error("儲存失敗，請稍後再試")
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="rounded-t-[2rem]">
        <DrawerHeader className="pb-2">
          <DrawerTitle className="text-xl">紀錄體重</DrawerTitle>
          <DrawerDescription>
            每次紀錄都會保留，可用於追蹤體重變化趨勢。
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-2">
          <FieldGroup>
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="weight">體重 (kg)</FieldLabel>
              <Input
                id="weight"
                type="number"
                inputMode="decimal"
                step="0.1"
                placeholder="如：65.5"
                className="h-12 rounded-2xl"
                value={weight}
                aria-invalid={!!error}
                onChange={(e) => setWeight(e.target.value)}
              />
              {error && <FieldError>{error}</FieldError>}
            </Field>

            <Field>
              <label
                htmlFor="update-goal"
                className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors has-[[data-state=checked]]:border-primary/40"
              >
                <Checkbox
                  id="update-goal"
                  checked={canUpdateGoal}
                  disabled={!profileReady}
                  onCheckedChange={(v) => setUpdateGoal(v === true)}
                  className="mt-0.5"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-medium text-foreground">
                    依新體重更新每日卡路里目標
                  </span>
                  <FieldDescription className="text-xs">
                    {profileReady
                      ? "以 Mifflin-St Jeor 公式計算 TDEE，扣除熱量赤字後自動更新目標。"
                      : "請先至「設定」填寫身高、年齡等身體資料才能自動計算。"}
                  </FieldDescription>
                </div>
              </label>
            </Field>

            {canUpdateGoal && preview && (
              <div className="flex flex-col gap-2 rounded-2xl bg-muted/60 p-4 text-sm">
                <PreviewRow label="基礎代謝 BMR" value={preview.bmr} />
                <PreviewRow label="每日消耗 TDEE" value={preview.tdee} />
                <PreviewRow
                  label={`熱量赤字 −${preview.deficit}`}
                  value={preview.rawGoal}
                  muted
                />
                <div className="mt-1 flex items-baseline justify-between border-t border-border pt-2">
                  <span className="font-medium text-foreground">每日目標</span>
                  <span className="font-heading text-xl font-semibold tabular-nums text-primary">
                    {Math.round(preview.goal)} kcal
                  </span>
                </div>
                {preview.atFloor && (
                  <p className="text-xs text-muted-foreground">
                    已達安全底線，目標不低於 BMR。
                  </p>
                )}
              </div>
            )}
          </FieldGroup>
        </div>

        <DrawerFooter className="gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="h-12 rounded-2xl text-base shadow-lg shadow-primary/20"
          >
            儲存紀錄
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-12 rounded-2xl"
          >
            取消
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}

function PreviewRow({
  label,
  value,
  muted,
}: {
  label: string
  value: number
  muted?: boolean
}) {
  return (
    <div className="flex items-center justify-between">
      <span className={muted ? "text-muted-foreground" : "text-foreground/80"}>
        {label}
      </span>
      <span className="tabular-nums text-muted-foreground">
        {Math.round(value)} kcal
      </span>
    </div>
  )
}
