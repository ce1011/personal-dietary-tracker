import { createContext, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { WeightForm } from "@/components/weight-form"
import type { WeightLog } from "@/types"

interface OpenWeightFormOptions {
  defaultWeight?: WeightLog
}

interface WeightFormContextValue {
  openWeightForm: (options?: OpenWeightFormOptions) => void
}

const WeightFormContext = createContext<WeightFormContextValue | null>(null)

export function WeightFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [defaultWeight, setDefaultWeight] = useState<WeightLog | undefined>(undefined)

  const value = useMemo<WeightFormContextValue>(
    () => ({
      openWeightForm: (options?: OpenWeightFormOptions) => {
        setDefaultWeight(options?.defaultWeight)
        setOpen(true)
      },
    }),
    []
  )

  return (
    <WeightFormContext.Provider value={value}>
      {children}
      <WeightForm
        open={open}
        onOpenChange={setOpen}
        defaultWeight={defaultWeight}
      />
    </WeightFormContext.Provider>
  )
}

export function useWeightForm(): WeightFormContextValue {
  const ctx = useContext(WeightFormContext)
  if (!ctx) throw new Error("useWeightForm must be used within WeightFormProvider")
  return ctx
}
