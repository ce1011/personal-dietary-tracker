# Insights Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 4th nav tab "統計" (Insights) with a single-column dashboard showing weight trend, calorie adherence, and eating habits over a selectable date range, using custom SVG charts.

**Architecture:** A new `InsightsView` renders three story sections (體重趨勢 → 熱量達標 → 飲食習慣). Pure aggregation functions live in `src/lib/insights.ts` (framework-free). `useLiveQuery` hooks in `src/hooks/use-insights.ts` feed Dexie data into those functions. Chart components render custom SVG via shared primitives. A `targetWeight` field is added to `Profile` for the weight goal line.

**Tech Stack:** React 19, TypeScript (strict), Bun, Vite, Tailwind CSS v4, Dexie.js + dexie-react-hooks, shadcn/ui, lucide-react. No chart library.

## Global Constraints

- **UI language:** Traditional Chinese (`zh-Hant`). All user-facing strings in zh-Hant.
- **Package manager:** Bun (`bun run lint`, `bun run build`, `bun run dev`).
- **No test runner configured** — verify via `bun run lint` then `bun run build` after each task. Run `bun run dev` at integration milestones.
- **`verbatimModuleSyntax: true`** — use `import type { ... }` for all type-only imports.
- **`erasableSyntaxOnly: true`** — no `enum` or `namespace`; use union types / `as const`.
- **`noUnusedLocals` / `noUnusedParameters`** — no unused imports, variables, or parameters or the build fails.
- **React Compiler enabled** — do not add manual `useMemo` / `memo` unless provably required.
- **Path alias:** `@/` maps to `./src`.
- **Tailwind v4** via `@tailwindcss/vite` — use utility classes; do not touch `src/index.css` imports.
- **Single JS chunk** — no code-splitting / dynamic imports.
- **Existing color semantics:** `fill-primary` = on-target, `fill-accent` / `text-accent` = over-target (shiso red). `text-muted-foreground` = secondary.
- **Date utilities** in `src/lib/date.ts`: `dateKey`, `startOfDay`, `addDays`, `isSameDay`, `isToday`, `formatLongDate`.
- **Meal types** in `src/lib/meal-type.ts`: `MEAL_TYPES = ["早餐","午餐","晚餐","零食"]`.

---

## File Structure

| File | Responsibility | Action |
|---|---|---|
| `src/types/index.ts` | Add `targetWeight?: number` to `Profile` | Modify |
| `src/lib/date.ts` | Add `formatMonthDay` helper for `M/D` chart labels | Modify |
| `src/lib/insights.ts` | Pure aggregation: rolling avg, daily totals, adherence, meal dist, top foods, top locations, weight stats, range helpers | Create |
| `src/components/insights/svg-chart-primitives.tsx` | SVG scale functions, path builder, axis label helper | Create |
| `src/components/insights/insight-stat-card.tsx` | Shared mini stat card (label + big number + unit) | Create |
| `src/components/insights/insight-empty-state.tsx` | Shared empty hint card with optional action button | Create |
| `src/components/insights/range-selector.tsx` | Segmented control `[7天 \| 30天 \| 90天 \| 全部]` | Create |
| `src/hooks/use-insights.ts` | `useLiveQuery` hooks: weight logs in range, diet logs in range | Create |
| `src/components/insights/weight-trend-chart.tsx` | SVG: dots + 7-day rolling avg line + optional goal line | Create |
| `src/components/insights/calorie-adherence-chart.tsx` | SVG: daily bars + goal line + adherence stats cards | Create |
| `src/components/insights/meal-distribution-chart.tsx` | SVG donut + legend | Create |
| `src/components/insights/top-foods-list.tsx` | Ranked top-5 foods list | Create |
| `src/components/insights/top-locations-list.tsx` | Horizontal bar list of locations | Create |
| `src/views/insights-view.tsx` | Orchestrates range state + renders all sections | Create |
| `src/components/bottom-nav.tsx` | Add "統計" tab | Modify |
| `src/App.tsx` | Add `insights` tab + render `<InsightsView>` | Modify |
| `src/components/profile-form.tsx` | Add "目標體重" input field | Modify |

---

## Task 1: Add `targetWeight` to Profile schema

**Files:**
- Modify: `src/types/index.ts:38-44`
- Modify: `src/components/profile-form.tsx:32-38, 43-49, 58-66, 69-74, 90-103, 105-115, 263-283`

**Interfaces:**
- Produces: `Profile.targetWeight?: number` — consumed by `weight-trend-chart.tsx` (Task 7) and `insights-view.tsx` (Task 11).

- [ ] **Step 1: Add the field to `Profile` in `src/types/index.ts`**

Add `targetWeight?: number` as the last field of the `Profile` interface:

```ts
export interface Profile {
  height: number
  age: number
  sex: Sex
  activity: ActivityLevel
  deficit: number
  targetWeight?: number
}
```

- [ ] **Step 2: Add `targetWeight` to `ProfileFormValues` and form state in `src/components/profile-form.tsx`**

Add `targetWeight: string` to the `ProfileFormValues` interface (after `deficit`):

```ts
interface ProfileFormValues {
  height: string
  age: string
  sex: string
  activity: string
  deficit: string
  targetWeight: string
}
```

Add `targetWeight: ""` to the `useState` initial value (after `deficit: EMPTY`):

```ts
const [values, setValues] = useState<ProfileFormValues>({
  height: "",
  age: "",
  sex: EMPTY,
  activity: EMPTY,
  deficit: EMPTY,
  targetWeight: "",
})
```

In the `useEffect` that syncs from `profile`, add the `targetWeight` line after `deficit`:

```ts
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
```

- [ ] **Step 3: Add the target-weight input field to the form JSX**

Insert a new `Field` block immediately **before** the `{preview && (` block (around line 231), after the 減脂強度 `Field`:

```tsx
<Field>
  <FieldLabel htmlFor="profile-target-weight">目標體重 (kg)（選填）</FieldLabel>
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
```

- [ ] **Step 4: Include `targetWeight` in `buildProfile`**

Modify `buildProfile` to parse and include `targetWeight`:

```ts
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
```

- [ ] **Step 5: Verify**

Run: `bun run lint && bun run build`
Expected: both pass with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/types/index.ts src/components/profile-form.tsx
git commit -m "Add optional targetWeight to Profile"
```

---

## Task 2: Pure aggregation functions in `lib/insights.ts`

**Files:**
- Create: `src/lib/insights.ts`
- Modify: `src/lib/date.ts` (add `formatMonthDay`)

**Interfaces:**
- Consumes: `WeightLog`, `DietLog`, `MealType` from `@/types`; `MEAL_TYPES` from `@/lib/meal-type`; `dateKey`, `startOfDay`, `addDays` from `@/lib/date`.
- Produces (all exported, consumed by hooks + chart components in later tasks):

```ts
export type RangeKey = "7" | "30" | "90" | "all"
export interface DateRange { start: Date; end: Date }
export interface WeightPoint { date: Date; value: number }
export interface DayTotal { date: Date; total: number | null }
export interface MealSlice { type: MealType; calories: number; percent: number }
export interface FoodTally { name: string; calories: number; count: number }
export interface LocationTally { location: string; calories: number; percent: number }
export interface WeightStats { delta: number; loggedDays: number; first: number | null; latest: number | null }
export interface AdherenceStats { adherenceRate: number; avgDailyCalories: number; loggedDays: number }

export function rangeForDays(days: number): DateRange
export function rollingAverageWeight(logs: WeightLog[]): WeightPoint[]
export function weightStats(logs: WeightLog[]): WeightStats
export function dailyCalorieTotals(logs: DietLog[], range: DateRange): DayTotal[]
export function adherenceStats(totals: DayTotal[], goal: number): AdherenceStats
export function mealDistribution(logs: DietLog[]): MealSlice[]
export function topFoods(logs: DietLog[], n: number): FoodTally[]
export function topLocations(logs: DietLog[]): LocationTally[]
```

- [ ] **Step 1: Add `formatMonthDay` to `src/lib/date.ts`**

Append at the end of the file:

```ts
export function formatMonthDay(date: Date): string {
  return new Intl.DateTimeFormat("zh-Hant", {
    month: "numeric",
    day: "numeric",
  }).format(date)
}
```

- [ ] **Step 2: Create `src/lib/insights.ts` with all aggregation functions**

```ts
import type { DietLog, MealType, WeightLog } from "@/types"
import { MEAL_TYPES } from "@/lib/meal-type"
import { addDays, dateKey, startOfDay } from "@/lib/date"

export type RangeKey = "7" | "30" | "90" | "all"

export interface DateRange {
  start: Date
  end: Date
}

export interface WeightPoint {
  date: Date
  value: number
}

export interface DayTotal {
  date: Date
  total: number | null
}

export interface MealSlice {
  type: MealType
  calories: number
  percent: number
}

export interface FoodTally {
  name: string
  calories: number
  count: number
}

export interface LocationTally {
  location: string
  calories: number
  percent: number
}

export interface WeightStats {
  delta: number
  loggedDays: number
  first: number | null
  latest: number | null
}

export interface AdherenceStats {
  adherenceRate: number
  avgDailyCalories: number
  loggedDays: number
}

export function rangeForDays(days: number): DateRange {
  const end = startOfDay(new Date())
  const start = addDays(end, -(days - 1))
  return { start, end }
}

export function rollingAverageWeight(logs: WeightLog[]): WeightPoint[] {
  if (logs.length < 2) return []
  const sorted = [...logs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )
  const points: WeightPoint[] = []
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i]
    const windowStart = startOfDay(addDays(current.timestamp, -6))
    const inWindow = sorted.filter(
      (l) => l.timestamp >= windowStart && l.timestamp <= current.timestamp
    )
    const avg =
      inWindow.reduce((sum, l) => sum + l.weight, 0) / inWindow.length
    points.push({ date: current.timestamp, value: avg })
  }
  return points
}

export function weightStats(logs: WeightLog[]): WeightStats {
  if (logs.length === 0) {
    return { delta: 0, loggedDays: 0, first: null, latest: null }
  }
  const sorted = [...logs].sort(
    (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
  )
  const days = new Set(sorted.map((l) => dateKey(l.timestamp))).size
  const first = sorted[0].weight
  const latest = sorted[sorted.length - 1].weight
  return {
    delta: first - latest,
    loggedDays: days,
    first,
    latest,
  }
}

export function dailyCalorieTotals(
  logs: DietLog[],
  range: DateRange
): DayTotal[] {
  const byDay = new Map<string, number>()
  for (const log of logs) {
    const key = dateKey(log.timestamp)
    byDay.set(key, (byDay.get(key) ?? 0) + log.calories)
  }
  const result: DayTotal[] = []
  const cursor = startOfDay(range.start)
  const end = startOfDay(range.end)
  while (cursor <= end) {
    const key = dateKey(cursor)
    result.push({ date: new Date(cursor), total: byDay.get(key) ?? null })
    cursor.setDate(cursor.getDate() + 1)
  }
  return result
}

export function adherenceStats(
  totals: DayTotal[],
  goal: number
): AdherenceStats {
  const logged = totals.filter(
    (d): d is DayTotal & { total: number } => d.total !== null
  )
  if (logged.length === 0) {
    return { adherenceRate: 0, avgDailyCalories: 0, loggedDays: 0 }
  }
  const onTarget = logged.filter((d) => d.total <= goal).length
  const sum = logged.reduce((acc, d) => acc + d.total, 0)
  return {
    adherenceRate: (onTarget / logged.length) * 100,
    avgDailyCalories: sum / logged.length,
    loggedDays: logged.length,
  }
}

export function mealDistribution(logs: DietLog[]): MealSlice[] {
  const total = logs.reduce((sum, l) => sum + l.calories, 0)
  return MEAL_TYPES.map((type) => {
    const calories = logs
      .filter((l) => l.meal_type === type)
      .reduce((sum, l) => sum + l.calories, 0)
    return {
      type,
      calories,
      percent: total > 0 ? (calories / total) * 100 : 0,
    }
  })
}

export function topFoods(logs: DietLog[], n: number): FoodTally[] {
  const map = new Map<string, { calories: number; count: number }>()
  for (const log of logs) {
    const entry = map.get(log.food_name) ?? { calories: 0, count: 0 }
    entry.calories += log.calories
    entry.count += 1
    map.set(log.food_name, entry)
  }
  return [...map.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.calories - a.calories)
    .slice(0, n)
}

export function topLocations(logs: DietLog[]): LocationTally[] {
  const withLocation = logs.filter((l) => l.location.trim() !== "")
  const total = withLocation.reduce((sum, l) => sum + l.calories, 0)
  const map = new Map<string, number>()
  for (const log of withLocation) {
    map.set(log.location, (map.get(log.location) ?? 0) + log.calories)
  }
  return [...map.entries()]
    .map(([location, calories]) => ({
      location,
      calories,
      percent: total > 0 ? (calories / total) * 100 : 0,
    }))
    .sort((a, b) => b.calories - a.calories)
}
```

- [ ] **Step 3: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/lib/date.ts src/lib/insights.ts
git commit -m "Add insights aggregation functions"
```

---

## Task 3: SVG chart primitives

**Files:**
- Create: `src/components/insights/svg-chart-primitives.tsx`

**Interfaces:**
- Produces (all exported, consumed by chart components):

```ts
export function linearScale(domain: [number, number], range: [number, number]): (value: number) => number
export function buildLinePath(points: Array<{ x: number; y: number }>): string
export function niceBounds(min: number, max: number, padding?: number): [number, number]
export function tickDates(start: Date, end: Date, count: number): Date[]
```

- [ ] **Step 1: Create `src/components/insights/svg-chart-primitives.tsx`**

```ts
export function linearScale(
  domain: [number, number],
  range: [number, number]
): (value: number) => number {
  const [d0, d1] = domain
  const [r0, r1] = range
  if (d1 === d0) return () => (r0 + r1) / 2
  return (value: number) => r0 + ((value - d0) / (d1 - d0)) * (r1 - r0)
}

export function buildLinePath(
  points: Array<{ x: number; y: number }>
): string {
  if (points.length === 0) return ""
  return points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ")
}

export function niceBounds(
  min: number,
  max: number,
  padding = 0.1
): [number, number] {
  if (min === max) {
    const p = Math.abs(min) * padding || 1
    return [min - p, max + p]
  }
  const span = max - min
  return [min - span * padding, max + span * padding]
}

export function tickDates(start: Date, end: Date, count: number): Date[] {
  const startMs = start.getTime()
  const endMs = end.getTime()
  if (count <= 1) return [new Date(startMs)]
  const step = (endMs - startMs) / (count - 1)
  return Array.from({ length: count }, (_, i) => new Date(startMs + step * i))
}
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/insights/svg-chart-primitives.tsx
git commit -m "Add SVG chart primitives"
```

---

## Task 4: Shared UI components (stat card, empty state, range selector)

**Files:**
- Create: `src/components/insights/insight-stat-card.tsx`
- Create: `src/components/insights/insight-empty-state.tsx`
- Create: `src/components/insights/range-selector.tsx`

**Interfaces:**
- Consumes: `RangeKey` from `@/lib/insights`.
- Produces:
  - `<InsightStatCard label value unit? />`
  - `<InsightEmptyState message actionLabel? onAction? />`
  - `<RangeSelector value onChange />` where `value: RangeKey`, `onChange: (key: RangeKey) => void`

- [ ] **Step 1: Create `src/components/insights/insight-stat-card.tsx`**

```tsx
import { cn } from "@/lib/utils"

interface InsightStatCardProps {
  label: string
  value: string
  unit?: string
  className?: string
}

export function InsightStatCard({
  label,
  value,
  unit,
  className,
}: InsightStatCardProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-0.5 rounded-2xl border border-border bg-card p-3.5 shadow-sm",
        className
      )}
    >
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex items-baseline gap-1">
        <span className="font-heading text-2xl font-semibold tabular-nums text-foreground">
          {value}
        </span>
        {unit && (
          <span className="text-xs text-muted-foreground">{unit}</span>
        )}
      </span>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/insights/insight-empty-state.tsx`**

```tsx
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
```

- [ ] **Step 3: Create `src/components/insights/range-selector.tsx`**

```tsx
import { cn } from "@/lib/utils"
import type { RangeKey } from "@/lib/insights"

const OPTIONS: Array<{ key: RangeKey; label: string }> = [
  { key: "7", label: "7天" },
  { key: "30", label: "30天" },
  { key: "90", label: "90天" },
  { key: "all", label: "全部" },
]

interface RangeSelectorProps {
  value: RangeKey
  onChange: (key: RangeKey) => void
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="sticky top-0 z-10 -mx-4 flex justify-center bg-background/80 px-4 pb-2 pt-1 backdrop-blur">
      <div className="flex gap-1 rounded-2xl border border-border bg-card p-1 shadow-sm">
        {OPTIONS.map((opt) => (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={cn(
              "rounded-xl px-4 py-1.5 text-sm font-medium transition-all",
              value === opt.key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/insights/insight-stat-card.tsx src/components/insights/insight-empty-state.tsx src/components/insights/range-selector.tsx
git commit -m "Add insights shared UI components"
```

---

## Task 5: `use-insights.ts` data hooks

**Files:**
- Create: `src/hooks/use-insights.ts`

**Interfaces:**
- Consumes: `db` from `@/db/db`, `WeightLog` / `DietLog` from `@/types`, `dateKey` / `startOfDay` / `addDays` from `@/lib/date`, `RangeKey` / `DateRange` from `@/lib/insights`.
- Produces:
  - `useWeightLogsInRange(range: DateRange): WeightLog[]`
  - `useDietLogsInRange(range: DateRange): DietLog[]`
  - `useInsightsRange(rangeKey: RangeKey): { weightRange: DateRange; dietRange: DateRange }` — computes the two ranges; for `"all"`, weight/diet ranges start at the earliest log of their own type (queried separately).

- [ ] **Step 1: Create `src/hooks/use-insights.ts`**

```ts
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/db/db"
import { addDays, dateKey, startOfDay } from "@/lib/date"
import type { DateRange, RangeKey } from "@/lib/insights"
import type { DietLog, WeightLog } from "@/types"

export function useWeightLogsInRange(range: DateRange): WeightLog[] {
  return (
    useLiveQuery(async () => {
      const start = startOfDay(range.start)
      const end = addDays(startOfDay(range.end), 1)
      const logs = await db.weight_logs
        .where("timestamp")
        .between(start, end, true, false)
        .toArray()
      return logs.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      )
    }, [dateKey(range.start), dateKey(range.end)]) ?? []
  )
}

export function useDietLogsInRange(range: DateRange): DietLog[] {
  return (
    useLiveQuery(async () => {
      const start = startOfDay(range.start)
      const end = addDays(startOfDay(range.end), 1)
      const logs = await db.diet_logs
        .where("timestamp")
        .between(start, end, true, false)
        .toArray()
      return logs.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime()
      )
    }, [dateKey(range.start), dateKey(range.end)]) ?? []
  )
}

export function useInsightsRange(
  rangeKey: RangeKey
): { weightRange: DateRange; dietRange: DateRange } {
  const earliestWeight = useLiveQuery(async () => {
    return db.weight_logs.orderBy("timestamp").first()
  })
  const earliestDiet = useLiveQuery(async () => {
    return db.diet_logs.orderBy("timestamp").first()
  })
  const today = startOfDay(new Date())
  if (rangeKey === "all") {
    return {
      weightRange: {
        start: earliestWeight ? startOfDay(earliestWeight.timestamp) : today,
        end: today,
      },
      dietRange: {
        start: earliestDiet ? startOfDay(earliestDiet.timestamp) : today,
        end: today,
      },
    }
  }
  const days = Number(rangeKey)
  const start = addDays(today, -(days - 1))
  return {
    weightRange: { start, end: today },
    dietRange: { start, end: today },
  }
}
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run build`
Expected: both pass. (Hooks are not yet consumed by any view, but the build must still type-check them.)

- [ ] **Step 3: Commit**

```bash
git add src/hooks/use-insights.ts
git commit -m "Add insights data hooks"
```

---

## Task 6: Weight trend chart

**Files:**
- Create: `src/components/insights/weight-trend-chart.tsx`

**Interfaces:**
- Consumes: `WeightLog` from `@/types`, `rollingAverageWeight` / `weightStats` / `WeightPoint` from `@/lib/insights`, `linearScale` / `buildLinePath` / `niceBounds` / `tickDates` from `./svg-chart-primitives`, `formatMonthDay` from `@/lib/date`, `InsightStatCard` from `./insight-stat-card`, `InsightEmptyState` from `./insight-empty-state`, `useWeightForm` from `@/components/weight-form-context`.
- Produces: `<WeightTrendChart logs={WeightLog[]} targetWeight={number | undefined} />`

- [ ] **Step 1: Create `src/components/insights/weight-trend-chart.tsx`**

```tsx
import type { WeightLog } from "@/types"
import { formatMonthDay } from "@/lib/date"
import { rollingAverageWeight, weightStats } from "@/lib/insights"
import {
  buildLinePath,
  linearScale,
  niceBounds,
  tickDates,
} from "@/components/insights/svg-chart-primitives"
import { InsightStatCard } from "@/components/insights/insight-stat-card"
import { InsightEmptyState } from "@/components/insights/insight-empty-state"
import { useWeightForm } from "@/components/weight-form-context"

interface WeightTrendChartProps {
  logs: WeightLog[]
  targetWeight?: number
}

const W = 320
const H = 160
const PAD = { top: 16, right: 16, bottom: 24, left: 40 }

export function WeightTrendChart({
  logs,
  targetWeight,
}: WeightTrendChartProps) {
  const { openWeightForm } = useWeightForm()
  const stats = weightStats(logs)
  const avgPoints = rollingAverageWeight(logs)

  if (logs.length < 2) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          體重趨勢
        </h2>
        <InsightEmptyState
          message="開始記錄體重，連續一週後就能看到趨勢線"
          actionLabel="紀錄體重"
          onAction={() => openWeightForm({})}
        />
      </section>
    )
  }

  const weights = logs.map((l) => l.weight)
  const allValues = [...weights, ...(targetWeight !== undefined ? [targetWeight] : [])]
  const [minW, maxW] = niceBounds(Math.min(...allValues), Math.max(...allValues))
  const earliest = logs[0].timestamp
  const latest = logs[logs.length - 1].timestamp
  const xScale = linearScale(
    [earliest.getTime(), latest.getTime()],
    [PAD.left, W - PAD.right]
  )
  const yScale = linearScale([minW, maxW], [H - PAD.bottom, PAD.top])

  const linePath = buildLinePath(
    avgPoints.map((p) => ({ x: xScale(p.date.getTime()), y: yScale(p.value) }))
  )
  const ticks = tickDates(earliest, latest, 4)
  const showGoal =
    targetWeight !== undefined &&
    targetWeight >= minW &&
    targetWeight <= maxW
  const goalY = showGoal ? yScale(targetWeight!) : null

  const deltaText =
    stats.delta > 0
      ? `-${stats.delta.toFixed(1)}`
      : `+${Math.abs(stats.delta).toFixed(1)}`

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        體重趨勢
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <InsightStatCard label="起始至今" value={deltaText} unit="kg" />
        <InsightStatCard
          label="有紀錄天數"
          value={String(stats.loggedDays)}
          unit="天"
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="體重趨勢圖"
        >
          {ticks.map((d, i) => (
            <text
              key={i}
              x={xScale(d.getTime())}
              y={H - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {formatMonthDay(d)}
            </text>
          ))}
          <text
            x={4}
            y={yScale(maxW) + 4}
            className="fill-muted-foreground text-[9px]"
          >
            {maxW.toFixed(1)}
          </text>
          <text
            x={4}
            y={yScale(minW) + 4}
            className="fill-muted-foreground text-[9px]"
          >
            {minW.toFixed(1)}
          </text>
          {showGoal && goalY !== null && (
            <>
              <line
                x1={PAD.left}
                y1={goalY}
                x2={W - PAD.right}
                y2={goalY}
                strokeWidth={1}
                className="stroke-primary/50"
                strokeDasharray="4 3"
              />
              <text
                x={W - PAD.right}
                y={goalY - 4}
                textAnchor="end"
                className="fill-primary/70 text-[8px]"
              >
                目標 {targetWeight}
              </text>
            </>
          )}
          {logs.map((l, i) => (
            <circle
              key={i}
              cx={xScale(l.timestamp.getTime())}
              cy={yScale(l.weight)}
              r={2.5}
              className="fill-muted-foreground/40"
            />
          ))}
          <path
            d={linePath}
            fill="none"
            strokeWidth={2}
            className="stroke-primary"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/insights/weight-trend-chart.tsx
git commit -m "Add weight trend chart"
```

---

## Task 7: Calorie adherence chart

**Files:**
- Create: `src/components/insights/calorie-adherence-chart.tsx`

**Interfaces:**
- Consumes: `DietLog` from `@/types`, `dailyCalorieTotals` / `adherenceStats` / `type DayTotal` / `type DateRange` from `@/lib/insights`, `linearScale` / `tickDates` from `./svg-chart-primitives`, `formatMonthDay` from `@/lib/date`, `InsightStatCard` / `InsightEmptyState` from `./insight-stat-card` / `./insight-empty-state`.
- Produces: `<CalorieAdherenceChart logs={DietLog[]} range={DateRange} goal={number} />`

- [ ] **Step 1: Create `src/components/insights/calorie-adherence-chart.tsx`**

```tsx
import type { DietLog } from "@/types"
import { formatMonthDay } from "@/lib/date"
import {
  adherenceStats,
  dailyCalorieTotals,
  type DateRange,
} from "@/lib/insights"
import {
  linearScale,
  tickDates,
} from "@/components/insights/svg-chart-primitives"
import { InsightStatCard } from "@/components/insights/insight-stat-card"
import { InsightEmptyState } from "@/components/insights/insight-empty-state"
import { cn } from "@/lib/utils"

interface CalorieAdherenceChartProps {
  logs: DietLog[]
  range: DateRange
  goal: number
}

const W = 320
const H = 160
const PAD = { top: 16, right: 12, bottom: 24, left: 12 }

export function CalorieAdherenceChart({
  logs,
  range,
  goal,
}: CalorieAdherenceChartProps) {
  const totals = dailyCalorieTotals(logs, range)
  const stats = adherenceStats(totals, goal)

  const loggedDays = totals.filter((d) => d.total !== null)

  if (loggedDays.length === 0) {
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          熱量達標
        </h2>
        <InsightEmptyState message="還沒有飲食紀錄。回到今日新增第一筆吧！" />
      </section>
    )
  }

  const maxTotal = Math.max(...totals.map((d) => d.total ?? 0), goal)
  const yScale = linearScale([0, maxTotal * 1.1], [H - PAD.bottom, PAD.top])
  const dayCount = totals.length
  const chartW = W - PAD.left - PAD.right
  const barW = dayCount > 30 ? Math.max(chartW / dayCount, 1.5) : chartW / dayCount - 1
  const gap = dayCount > 30 ? 0 : 1

  const goalY = yScale(goal)
  const ticks = tickDates(range.start, range.end, 4)

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        熱量達標
      </h2>
      <div className="grid grid-cols-2 gap-3">
        <InsightStatCard
          label="達標率"
          value={`${Math.round(stats.adherenceRate)}`}
          unit="%"
        />
        <InsightStatCard
          label="日均熱量"
          value={Math.round(stats.avgDailyCalories).toLocaleString("zh-Hant")}
          unit="kcal"
        />
      </div>
      <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="每日熱量圖"
        >
          <line
            x1={PAD.left}
            y1={goalY}
            x2={W - PAD.right}
            y2={goalY}
            strokeWidth={1}
            className="stroke-muted-foreground"
            strokeDasharray="4 3"
          />
          <text
            x={W - PAD.right}
            y={goalY - 3}
            textAnchor="end"
            className="fill-muted-foreground text-[8px]"
          >
            {goal.toLocaleString("zh-Hant")}
          </text>
          {totals.map((d, i) => {
            const x = PAD.left + i * (barW + gap)
            if (d.total === null) {
              return (
                <line
                  key={i}
                  x1={x + barW / 2}
                  y1={H - PAD.bottom}
                  x2={x + barW / 2}
                  y2={H - PAD.bottom + 2}
                  strokeWidth={1}
                  className="stroke-muted-foreground/30"
                />
              )
            }
            const barH = H - PAD.bottom - yScale(d.total)
            const over = d.total > goal
            return (
              <rect
                key={i}
                x={x}
                y={yScale(d.total)}
                width={barW}
                height={barH}
                rx={1}
                className={cn(over ? "fill-accent" : "fill-primary")}
              />
            )
          })}
          {ticks.map((d, i) => {
            const tickIdx = Math.round(
              ((d.getTime() - range.start.getTime()) /
                (range.end.getTime() - range.start.getTime())) *
                (dayCount - 1)
            )
            const x = PAD.left + tickIdx * (barW + gap) + barW / 2
            return (
              <text
                key={i}
                x={x}
                y={H - 6}
                textAnchor="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {formatMonthDay(d)}
              </text>
            )
          })}
        </svg>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/insights/calorie-adherence-chart.tsx
git commit -m "Add calorie adherence chart"
```

---

## Task 8: Meal distribution donut chart

**Files:**
- Create: `src/components/insights/meal-distribution-chart.tsx`

**Interfaces:**
- Consumes: `DietLog` from `@/types`, `mealDistribution` / `type MealSlice` from `@/lib/insights`, `MEAL_ICON` (defined locally, matching `bento-dashboard.tsx`).
- Produces: `<MealDistributionChart logs={DietLog[]} />`

- [ ] **Step 1: Create `src/components/insights/meal-distribution-chart.tsx`**

```tsx
import type { DietLog, MealType } from "@/types"
import { mealDistribution } from "@/lib/insights"

const MEAL_ICON: Record<MealType, string> = {
  早餐: "🍳",
  午餐: "🍱",
  晚餐: "🍜",
  零食: "🍪",
}

const SEGMENT_COLORS: Record<MealType, string> = {
  早餐: "fill-primary",
  午餐: "fill-primary/70",
  晚餐: "fill-primary/50",
  零食: "fill-accent/70",
}

interface MealDistributionChartProps {
  logs: DietLog[]
}

const R = 50
const STROKE = 18
const CIRCUMFERENCE = 2 * Math.PI * R

export function MealDistributionChart({ logs }: MealDistributionChartProps) {
  const slices = mealDistribution(logs)
  const totalCalories = slices.reduce((sum, s) => sum + s.calories, 0)

  let offset = 0
  const arcs = slices.map((slice) => {
    const fraction = slice.percent / 100
    const dash = fraction * CIRCUMFERENCE
    const arc = {
      ...slice,
      dasharray: `${dash} ${CIRCUMFERENCE - dash}`,
      dashoffset: -offset,
    }
    offset += dash
    return arc
  })

  return (
    <div className="flex items-center gap-4">
      <svg
        viewBox="0 0 120 120"
        className="size-28 shrink-0 -rotate-90"
        role="img"
        aria-label="餐別分布"
      >
        <circle
          cx={60}
          cy={60}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-muted/40"
        />
        {totalCalories > 0 &&
          arcs.map((arc) => (
            <circle
              key={arc.type}
              cx={60}
              cy={60}
              r={R}
              fill="none"
              strokeWidth={STROKE}
              className={SEGMENT_COLORS[arc.type]}
              strokeDasharray={arc.dasharray}
              strokeDashoffset={arc.dashoffset}
            />
          ))}
      </svg>
      <div className="flex flex-1 flex-col gap-1.5">
        {slices.map((slice) => (
          <div key={slice.type} className="flex items-center gap-2 text-sm">
            <span className="text-base">{MEAL_ICON[slice.type]}</span>
            <span className="flex-1 text-foreground">{slice.type}</span>
            <span className="tabular-nums text-muted-foreground">
              {slice.calories.toLocaleString("zh-Hant")} kcal
            </span>
            <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
              {Math.round(slice.percent)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/components/insights/meal-distribution-chart.tsx
git commit -m "Add meal distribution donut chart"
```

---

## Task 9: Top foods list and top locations list

**Files:**
- Create: `src/components/insights/top-foods-list.tsx`
- Create: `src/components/insights/top-locations-list.tsx`

**Interfaces:**
- Consumes: `DietLog` from `@/types`, `topFoods` / `topLocations` from `@/lib/insights`.
- Produces: `<TopFoodsList logs={DietLog[]} />`, `<TopLocationsList logs={DietLog[]} />`

- [ ] **Step 1: Create `src/components/insights/top-foods-list.tsx`**

```tsx
import type { DietLog } from "@/types"
import { topFoods } from "@/lib/insights"

interface TopFoodsListProps {
  logs: DietLog[]
}

export function TopFoodsList({ logs }: TopFoodsListProps) {
  const foods = topFoods(logs, 5)
  if (foods.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">常見食物</h3>
      <ol className="flex flex-col gap-1.5">
        {foods.map((food, i) => (
          <li
            key={food.name}
            className="flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2 text-sm"
          >
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary tabular-nums">
              {i + 1}
            </span>
            <span className="flex-1 truncate text-foreground">
              {food.name}
            </span>
            <span className="tabular-nums text-muted-foreground">
              {food.calories.toLocaleString("zh-Hant")} kcal
            </span>
            <span className="w-12 text-right text-xs text-muted-foreground tabular-nums">
              {food.count} 次
            </span>
          </li>
        ))}
      </ol>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/components/insights/top-locations-list.tsx`**

```tsx
import type { DietLog } from "@/types"
import { topLocations } from "@/lib/insights"

interface TopLocationsListProps {
  logs: DietLog[]
}

export function TopLocationsList({ logs }: TopLocationsListProps) {
  const locations = topLocations(logs)
  if (locations.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-foreground">用餐地點</h3>
      <div className="flex flex-col gap-1.5">
        {locations.map((loc) => (
          <div key={loc.location} className="flex items-center gap-2 text-sm">
            <span className="w-24 shrink-0 truncate text-foreground">
              {loc.location}
            </span>
            <div className="flex-1 overflow-hidden rounded-full bg-muted/40">
              <div
                className="h-2 rounded-full fill-primary bg-primary"
                style={{ width: `${Math.max(loc.percent, 3)}%` }}
              />
            </div>
            <span className="w-10 text-right tabular-nums text-xs text-muted-foreground">
              {Math.round(loc.percent)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/insights/top-foods-list.tsx src/components/insights/top-locations-list.tsx
git commit -m "Add top foods and top locations lists"
```

---

## Task 10: `InsightsView` orchestrator

**Files:**
- Create: `src/views/insights-view.tsx`

**Interfaces:**
- Consumes: `RangeSelector` from `@/components/insights/range-selector`, `WeightTrendChart` / `CalorieAdherenceChart` / `MealDistributionChart` / `TopFoodsList` / `TopLocationsList` from their respective files, `useInsightsRange` / `useWeightLogsInRange` / `useDietLogsInRange` / `RangeKey` from `@/hooks/use-insights` + `@/lib/insights`, `useProfile` / `useDailyCalorieGoal` from `@/hooks/use-settings`, `InsightEmptyState` from `@/components/insights/insight-empty-state`.
- Produces: `<InsightsView />` (consumed by `App.tsx` in Task 11).

- [ ] **Step 1: Create `src/views/insights-view.tsx`**

```tsx
import { useState } from "react"
import { RangeSelector } from "@/components/insights/range-selector"
import { WeightTrendChart } from "@/components/insights/weight-trend-chart"
import { CalorieAdherenceChart } from "@/components/insights/calorie-adherence-chart"
import { MealDistributionChart } from "@/components/insights/meal-distribution-chart"
import { TopFoodsList } from "@/components/insights/top-foods-list"
import { TopLocationsList } from "@/components/insights/top-locations-list"
import { InsightEmptyState } from "@/components/insights/insight-empty-state"
import { useInsightsRange, useWeightLogsInRange, useDietLogsInRange } from "@/hooks/use-insights"
import { useProfile, useDailyCalorieGoal } from "@/hooks/use-settings"
import type { RangeKey } from "@/lib/insights"

export function InsightsView() {
  const [rangeKey, setRangeKey] = useState<RangeKey>("30")
  const { weightRange, dietRange } = useInsightsRange(rangeKey)
  const weightLogs = useWeightLogsInRange(weightRange)
  const dietLogs = useDietLogsInRange(dietRange)
  const [profile] = useProfile()
  const [goal] = useDailyCalorieGoal()

  const hasDietLogs = dietLogs.length > 0

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 pb-5 pt-7">
      <header className="flex flex-col gap-0.5">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">
          飲食手帳
        </p>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground">
          統計
        </h1>
        <p className="text-sm text-muted-foreground">
          查看你的體重趨勢、熱量達標與飲食習慣。
        </p>
      </header>

      <RangeSelector value={rangeKey} onChange={setRangeKey} />

      <WeightTrendChart
        logs={weightLogs}
        targetWeight={profile?.targetWeight}
      />

      <CalorieAdherenceChart logs={dietLogs} range={dietRange} goal={goal} />

      <section className="flex flex-col gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          飲食習慣
        </h2>
        {hasDietLogs ? (
          <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <MealDistributionChart logs={dietLogs} />
            <TopFoodsList logs={dietLogs} />
            <TopLocationsList logs={dietLogs} />
          </div>
        ) : (
          <InsightEmptyState message="還沒有飲食紀錄。回到今日新增第一筆吧！" />
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Verify**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add src/views/insights-view.tsx
git commit -m "Add InsightsView orchestrator"
```

---

## Task 11: Wire into BottomNav and App

**Files:**
- Modify: `src/components/bottom-nav.tsx:1-10`
- Modify: `src/App.tsx:1-41`

**Interfaces:**
- Consumes: `InsightsView` from `@/views/insights-view`, `TrendingUpIcon` from `lucide-react`.
- Produces: The "統計" tab in the bottom nav and the `<InsightsView>` render branch.

- [ ] **Step 1: Add the insights tab to `src/components/bottom-nav.tsx`**

Add `TrendingUpIcon` to the lucide import:

```ts
import { TrendingUpIcon, UtensilsIcon, StarIcon, SettingsIcon } from "lucide-react"
```

Add `"insights"` to the `Tab` type:

```ts
export type Tab = "today" | "insights" | "presets" | "settings"
```

Add the insights entry to `TABS`, between `today` and `presets`:

```ts
const TABS: Array<{ id: Tab; label: string; icon: typeof UtensilsIcon }> = [
  { id: "today", label: "今日", icon: UtensilsIcon },
  { id: "insights", label: "統計", icon: TrendingUpIcon },
  { id: "presets", label: "預設", icon: StarIcon },
  { id: "settings", label: "設定", icon: SettingsIcon },
]
```

- [ ] **Step 2: Add the InsightsView branch to `src/App.tsx`**

Add the import after the other view imports:

```ts
import { InsightsView } from "@/views/insights-view"
```

Add the render branch, after the `today` block and before the `presets` block:

```tsx
{tab === "insights" && <InsightsView />}
```

The full main section should read:

```tsx
<main className="flex flex-1 flex-col overflow-y-auto">
  {tab === "today" &&
    (historyOpen ? (
      <HistoryView onBack={() => setHistoryOpen(false)} />
    ) : (
      <TodayView onOpenHistory={() => setHistoryOpen(true)} />
    ))}
  {tab === "insights" && <InsightsView />}
  {tab === "presets" && <PresetsView />}
  {tab === "settings" && <SettingsView />}
</main>
```

- [ ] **Step 3: Verify — lint and build**

Run: `bun run lint && bun run build`
Expected: both pass.

- [ ] **Step 4: Verify — manual dev check**

Run: `bun run dev` and open the printed URL (usually http://localhost:5173).

Check:
1. Bottom nav shows 4 tabs: 今日 / 統計 / 預設 / 設定.
2. Tapping 統計 shows the InsightsView with the range selector and three section headers.
3. With no data: weight section shows the "開始記錄體重" empty state; calorie and habits sections show "還沒有飲食紀錄" empty state.
4. Add a few weight + diet logs, switch ranges (7天/30天/90天/全部), and confirm charts render.
5. Set a target weight in Settings → return to 統計 → confirm the dashed goal line appears on the weight chart.
6. Tap through all 4 tabs to confirm no crashes and that History overlay still works on Today.

- [ ] **Step 5: Commit**

```bash
git add src/components/bottom-nav.tsx src/App.tsx
git commit -m "Wire InsightsView into bottom nav and App"
```
