import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { addPreset, updatePreset } from "@/hooks/use-preset-meals"
import { MEAL_TYPES } from "@/lib/meal-type"
import type { MealType, PresetMeal } from "@/types"

const NONE = "none"

interface PresetFormValues {
  meal_name: string
  calories: string
  serving_unit: string
  default_meal_type: string
  default_location: string
}

interface PresetFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editPreset?: PresetMeal
}

export function PresetForm({ open, onOpenChange, editPreset }: PresetFormProps) {
  const [values, setValues] = useState<PresetFormValues>({
    meal_name: "",
    calories: "",
    serving_unit: "",
    default_meal_type: NONE,
    default_location: "",
  })
  const [errors, setErrors] = useState<{
    meal_name?: string
    calories?: string
  }>({})

  useEffect(() => {
    if (!open) return
    setValues({
      meal_name: editPreset?.meal_name ?? "",
      calories: editPreset?.calories != null ? String(editPreset.calories) : "",
      serving_unit: editPreset?.serving_unit ?? "",
      default_meal_type: editPreset?.default_meal_type ?? NONE,
      default_location: editPreset?.default_location ?? "",
    })
    setErrors({})
  }, [open, editPreset])

  const isEdit = editPreset != null
  const hasUnit = values.serving_unit.trim().length > 0

  function update<K extends keyof PresetFormValues>(
    key: K,
    value: PresetFormValues[K]
  ) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!values.meal_name.trim()) next.meal_name = "請輸入餐點名稱"
    const cal = Number(values.calories)
    if (!values.calories.trim() || Number.isNaN(cal) || cal <= 0)
      next.calories = "請輸入大於 0 的卡路里"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const payload = {
      meal_name: values.meal_name.trim(),
      calories: Number(values.calories),
      serving_unit: values.serving_unit.trim() || undefined,
      default_meal_type:
        values.default_meal_type === NONE
          ? undefined
          : (values.default_meal_type as MealType),
      default_location: values.default_location.trim() || undefined,
    }
    try {
      if (isEdit && editPreset) {
        await updatePreset(editPreset.id, payload)
        toast.success("已更新預設餐點")
      } else {
        await addPreset(payload)
        toast.success("已新增預設餐點")
      }
      onOpenChange(false)
    } catch {
      toast.error("儲存失敗，請稍後再試")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {isEdit ? "編輯預設餐點" : "新增預設餐點"}
          </DialogTitle>
          <DialogDescription>
            建立常用組合，之後可一鍵帶入紀錄。
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 px-4">
          <FieldGroup>
            <Field data-invalid={!!errors.meal_name}>
              <FieldLabel htmlFor="preset-name">餐點名稱</FieldLabel>
              <Input
                id="preset-name"
                placeholder="如：黑咖啡 + 茶葉蛋"
                className="h-12 rounded-2xl"
                value={values.meal_name}
                aria-invalid={!!errors.meal_name}
                onChange={(e) => update("meal_name", e.target.value)}
              />
              {errors.meal_name && <FieldError>{errors.meal_name}</FieldError>}
            </Field>

            <Field>
              <FieldLabel htmlFor="preset-unit">份量單位（選填）</FieldLabel>
              <Input
                id="preset-unit"
                placeholder="如：個、片、碗、杯"
                className="h-12 rounded-2xl"
                value={values.serving_unit}
                onChange={(e) => update("serving_unit", e.target.value)}
              />
              <FieldDescription>
                填入後，紀錄時可選擇份量自動計算熱量。
              </FieldDescription>
            </Field>

            <Field data-invalid={!!errors.calories}>
              <FieldLabel htmlFor="preset-calories">
                {hasUnit ? "每份卡路里" : "卡路里"}
              </FieldLabel>
              <Input
                id="preset-calories"
                type="number"
                inputMode="numeric"
                placeholder="如：200"
                className="h-12 rounded-2xl"
                value={values.calories}
                aria-invalid={!!errors.calories}
                onChange={(e) => update("calories", e.target.value)}
              />
              {hasUnit && values.serving_unit.trim() && (
                <FieldDescription>
                  每 1 {values.serving_unit.trim()} 的熱量。
                </FieldDescription>
              )}
              {errors.calories && <FieldError>{errors.calories}</FieldError>}
            </Field>

            <Field>
              <FieldLabel>預設餐次（選填）</FieldLabel>
              <Select
                value={values.default_meal_type}
                onValueChange={(v) => update("default_meal_type", v)}
              >
                <SelectTrigger className="h-12 w-full rounded-2xl">
                  <SelectValue placeholder="不指定" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>不指定</SelectItem>
                  {MEAL_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="preset-location">
                預設地點（選填）
              </FieldLabel>
              <Input
                id="preset-location"
                placeholder="如：7-11"
                className="h-12 rounded-2xl"
                value={values.default_location}
                onChange={(e) => update("default_location", e.target.value)}
              />
            </Field>
          </FieldGroup>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-2xl"
          >
            取消
          </Button>
          <Button onClick={handleSubmit} className="h-11 rounded-2xl px-6">
            {isEdit ? "儲存變更" : "新增"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
