import { useRef, useState } from "react"
import { DownloadIcon, UploadIcon, TriangleAlertIcon } from "lucide-react"
import { toast } from "sonner"
import { useDailyCalorieGoal, DEFAULT_DAILY_GOAL } from "@/hooks/use-settings"
import { exportBackup, importBackup } from "@/lib/backup"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function SettingsView() {
  const [goal, setGoal] = useDailyCalorieGoal()
  const [goalInput, setGoalInput] = useState(String(goal))
  const [importFile, setImportFile] = useState<File | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function saveGoal() {
    const value = Number(goalInput)
    if (Number.isNaN(value) || value <= 0) {
      toast.error("請輸入大於 0 的數字")
      setGoalInput(String(goal))
      return
    }
    void setGoal(value)
    toast.success("已更新每日目標")
  }

  function handleExport() {
    void exportBackup().then(() => toast.success("已匯出備份檔"))
  }

  function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setImportFile(file)
      setConfirmOpen(true)
    }
    e.target.value = ""
  }

  async function handleImport() {
    if (!importFile) return
    setImporting(true)
    try {
      await importBackup(importFile)
      toast.success("匯入成功")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "匯入失敗")
    } finally {
      setImporting(false)
      setImportFile(null)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-5 pt-7">
      <header className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          個人設定
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          設定
        </h1>
        <p className="text-sm text-muted-foreground">
          管理每日目標與資料備份。
        </p>
      </header>

      <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>每日卡路里目標</CardTitle>
          <CardDescription>設定每日攝取上限，用於首頁便當格。</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="goal">每日目標 (kcal)</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="goal"
                  type="number"
                  inputMode="numeric"
                  value={goalInput}
                  onChange={(e) => setGoalInput(e.target.value)}
                  onBlur={saveGoal}
                  className="h-12 w-36 rounded-2xl text-base"
                />
                <Button
                  className="h-12 rounded-2xl px-6"
                  onClick={saveGoal}
                >
                  儲存
                </Button>
              </div>
              <FieldDescription className="text-xs">
                預設為 {DEFAULT_DAILY_GOAL} kcal。
              </FieldDescription>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <Separator />

      <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>資料備份</CardTitle>
          <CardDescription>
            匯出 JSON 檔案備份，避免瀏覽器清除快取導致資料遺失。
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Button
            variant="outline"
            className="h-12 justify-start gap-3 rounded-2xl border-border text-base"
            onClick={handleExport}
          >
            <DownloadIcon className="size-5" data-icon="inline-start" />
            匯出備份
          </Button>
          <Button
            variant="outline"
            className="h-12 justify-start gap-3 rounded-2xl border-border text-base"
            onClick={() => fileRef.current?.click()}
          >
            <UploadIcon className="size-5" data-icon="inline-start" />
            匯入備份
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handlePickFile}
          />
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <TriangleAlertIcon className="size-3.5 shrink-0" />
            匯入會覆蓋目前所有資料，請先匯出備份。
          </p>
        </CardContent>
      </Card>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>確認匯入並覆蓋資料？</AlertDialogTitle>
            <AlertDialogDescription>
              匯入後將清除並取代目前所有的飲食紀錄、預設餐點與設定。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={importing} className="rounded-2xl">
              取消
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={importing}
              onClick={(e) => {
                e.preventDefault()
                void handleImport()
              }}
              className="rounded-2xl"
            >
              {importing ? "匯入中…" : "確認匯入"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
