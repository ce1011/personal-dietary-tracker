import { createContext, useContext, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { LogForm } from "@/components/log-form"
import type { DietLog, PresetMeal } from "@/types"

interface OpenLogFormOptions {
  editLog?: DietLog
  preset?: PresetMeal
  defaultDate?: Date
}

interface LogFormContextValue {
  openLogForm: (options?: OpenLogFormOptions) => void
}

const LogFormContext = createContext<LogFormContextValue | null>(null)

export function LogFormProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [editLog, setEditLog] = useState<DietLog | undefined>(undefined)
  const [preset, setPreset] = useState<PresetMeal | undefined>(undefined)
  const [defaultDate, setDefaultDate] = useState<Date | undefined>(undefined)

  const value = useMemo<LogFormContextValue>(
    () => ({
      openLogForm: (options?: OpenLogFormOptions) => {
        setEditLog(options?.editLog)
        setPreset(options?.preset)
        setDefaultDate(options?.defaultDate)
        setOpen(true)
      },
    }),
    []
  )

  return (
    <LogFormContext.Provider value={value}>
      {children}
      <LogForm
        open={open}
        onOpenChange={setOpen}
        editLog={editLog}
        preset={preset}
        defaultDate={defaultDate}
      />
    </LogFormContext.Provider>
  )
}

export function useLogForm(): LogFormContextValue {
  const ctx = useContext(LogFormContext)
  if (!ctx) throw new Error("useLogForm must be used within LogFormProvider")
  return ctx
}
