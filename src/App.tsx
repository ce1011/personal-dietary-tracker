import { useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { BottomNav, type Tab } from "@/components/bottom-nav"
import { LogFormProvider } from "@/components/log-form-context"
import { WeightFormProvider } from "@/components/weight-form-context"
import { Toaster } from "@/components/ui/sonner"
import { TodayView } from "@/views/today-view"
import { HistoryView } from "@/views/history-view"
import { PresetsView } from "@/views/presets-view"
import { SettingsView } from "@/views/settings-view"

export default function App() {
  const [tab, setTab] = useState<Tab>("today")
  const [historyOpen, setHistoryOpen] = useState(false)

  function handleChangeTab(next: Tab) {
    setHistoryOpen(false)
    setTab(next)
  }

  return (
    <AppLayout>
      <LogFormProvider>
        <WeightFormProvider>
          <main className="flex flex-1 flex-col overflow-y-auto">
            {tab === "today" &&
              (historyOpen ? (
                <HistoryView onBack={() => setHistoryOpen(false)} />
              ) : (
                <TodayView onOpenHistory={() => setHistoryOpen(true)} />
              ))}
            {tab === "presets" && <PresetsView />}
            {tab === "settings" && <SettingsView />}
          </main>
          <BottomNav active={tab} onChange={handleChangeTab} />
        </WeightFormProvider>
      </LogFormProvider>
      <Toaster position="top-center" />
    </AppLayout>
  )
}
