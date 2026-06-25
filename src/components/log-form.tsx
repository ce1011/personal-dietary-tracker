import { useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { addLog, updateLog } from "@/hooks/use-diet-logs"
import { MEAL_TYPES, detectMealType } from "@/lib/meal-type"
import {
  fromLocalDateTimeInputValue,
  toLocalDateTimeInputValue,
} from "@/lib/date"
import type { DietLog, MealType, PresetMeal } from "@/types"

interface LogFormValues {
  timestamp: Date
  meal_type: MealType
  location: string
  food_name: string
  calories: string
}

interface LogFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editLog?: DietLog
  preset?: PresetMeal
  defaultDate?: Date
}

export function LogForm({
  open,
  onOpenChange,
  editLog,
  preset,
  defaultDate,
}: LogFormProps) {
  const [values, setValues] = useState<LogFormValues>({
    timestamp: new Date(),
    meal_type: "早餐",
    location: "",
    food_name: "",
    calories: "",
  })
  const [errors, setErrors] = useState<{
    food_name?: string
    calories?: string
  }>({})

  useEffect(() => {
    if (!open) return
    const baseDate = defaultDate ?? new Date()
    setValues({
      timestamp: editLog?.timestamp ?? baseDate,
      meal_type:
        editLog?.meal_type ?? preset?.default_meal_type ?? detectMealType(baseDate),
      location: editLog?.location ?? preset?.default_location ?? "",
      food_name: editLog?.food_name ?? preset?.meal_name ?? "",
      calories:
        editLog?.calories != null
          ? String(editLog.calories)
          : preset?.calories != null
            ? String(preset.calories)
            : "",
    })
    setErrors({})
  }, [open, editLog, preset, defaultDate])

  const isEdit = editLog != null

  function update<K extends keyof LogFormValues>(key: K, value: LogFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  function validate(): boolean {
    const next: typeof errors = {}
    if (!values.food_name.trim()) next.food_name = "請輸入食物名稱"
    const cal = Number(values.calories)
    if (!values.calories.trim() || Number.isNaN(cal) || cal <= 0)
      next.calories = "請輸入大於 0 的卡路里"
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit() {
    if (!validate()) return
    const payload = {
      timestamp: values.timestamp,
      meal_type: values.meal_type,
      location: values.location.trim(),
      food_name: values.food_name.trim(),
      calories: Number(values.calories),
    }
    try {
      if (isEdit && editLog) {
        await updateLog(editLog.id, payload)
        toast.success("已更新紀錄")
      } else {
        await addLog(payload)
        toast.success("已新增紀錄")
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
          <DrawerTitle className="text-xl">
            {isEdit ? "編輯紀錄" : "新增紀錄"}
          </DrawerTitle>
          <DrawerDescription>
            填寫飲食資訊，餐次會依時間自動預設。
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-5 overflow-y-auto px-5 pb-2">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="log-time">時間</FieldLabel>
              <Input
                id="log-time"
                type="datetime-local"
                className="h-12 rounded-2xl"
                value={toLocalDateTimeInputValue(values.timestamp)}
                onChange={(e) =>
                  update("timestamp", fromLocalDateTimeInputValue(e.target.value))
                }
              />
            </Field>

            <Field>
              <FieldLabel>餐次</FieldLabel>
              <ToggleGroup
                type="single"
                value={values.meal_type}
                onValueChange={(v) => {
                  if (v) update("meal_type", v as MealType)
                }}
                variant="outline"
                className="w-full gap-2"
                spacing={0}
              >
                {MEAL_TYPES.map((type) => (
                  <ToggleGroupItem
                    key={type}
                    value={type}
                    className="h-12 flex-1 rounded-2xl text-sm"
                    aria-label={type}
                  >
                    {type}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
              <FieldDescription className="text-xs">依目前時間自動預設。</FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="log-location">地點 / 情境（選填）</FieldLabel>
              <Input
                id="log-location"
                placeholder="如：外食、自煮、茶餐廳"
                className="h-12 rounded-2xl"
                value={values.location}
                onChange={(e) => update("location", e.target.value)}
              />
            </Field>

            <Field data-invalid={!!errors.food_name}>
              <FieldLabel htmlFor="log-food">食物名稱</FieldLabel>
              <Input
                id="log-food"
                placeholder="如：煎雞胸肉 + 西蘭花"
                className="h-12 rounded-2xl"
                value={values.food_name}
                aria-invalid={!!errors.food_name}
                onChange={(e) => update("food_name", e.target.value)}
              />
              {errors.food_name && <FieldError>{errors.food_name}</FieldError>}
            </Field>

            <Field data-invalid={!!errors.calories}>
              <FieldLabel htmlFor="log-calories">卡路里</FieldLabel>
              <Input
                id="log-calories"
                type="number"
                inputMode="numeric"
                placeholder="如：450"
                className="h-12 rounded-2xl"
                value={values.calories}
                aria-invalid={!!errors.calories}
                onChange={(e) => update("calories", e.target.value)}
              />
              {errors.calories && <FieldError>{errors.calories}</FieldError>}
            </Field>
          </FieldGroup>
        </div>

        <DrawerFooter className="gap-2 pt-4">
          <Button
            onClick={handleSubmit}
            size="lg"
            className="h-12 rounded-2xl text-base shadow-lg shadow-primary/20"
          >
            {isEdit ? "儲存變更" : "新增紀錄"}
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
