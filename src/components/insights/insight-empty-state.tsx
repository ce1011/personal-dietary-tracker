import { Button } from "@/components/ui/button"

interface InsightEmptyStateProps {
  message: string
  actionLabel?: string
  onAction?: () => void
}

export function InsightEmptyState({
  message,
  actionLabel,
  onAction,
}: InsightEmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
