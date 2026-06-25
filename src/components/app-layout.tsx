import { useEffect } from "react"
import type { ReactNode } from "react"
import { useSystemTheme } from "@/hooks/use-system-theme"
import { cn } from "@/lib/utils"

export function AppLayout({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const theme = useSystemTheme()

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
  }, [theme])

  return (
    <div className={cn("mx-auto flex h-svh w-full max-w-md flex-col overflow-hidden", className)}>
      {children}
    </div>
  )
}
