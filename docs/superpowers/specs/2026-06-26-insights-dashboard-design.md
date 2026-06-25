# Insights Dashboard for Weight-Loss Newbies — Design

**Date:** 2026-06-26
**Status:** Approved (brainstormed)
**App context:** Single-page React 19 + Bun + shadcn + Dexie IndexedDB, zh-Hant UI. Today/Presets/Settings tabs with History overlay on Today.

## Purpose

A weight-loss newbie currently sees only single-day data (today's weight, today's calories vs goal, per-meal bento, and a day-by-day history browser). Daily weight fluctuates and is demotivating without context. The Insights dashboard gives a balanced view across three jobs-to-be-done:

1. **Reassurance** — show weight trending down despite daily fluctuations
2. **Accountability** — show whether the calorie deficit is being hit
3. **Awareness** — show patterns in how/when/where the user eats

## Key decisions

| Decision | Choice |
|---|---|
| Primary goal | All three (trend + adherence + habits), balanced |
| Placement | New 4th bottom-nav tab "統計" |
| Chart rendering | Custom SVG only, no chart library |
| Time range | Selectable 7天 / 30天 / 90天 / 全部, default 30天 |
| Weight chart style | Raw dots + bold 7-day rolling-average line |
| Layout | Single-column story flow (scroll) |

## Architecture & navigation

A new 4th nav tab "統計" (Insights) is added to `BottomNav` between 今日 and 預設. Final tab order: 今日 / **統計** / 預設 / 設定. Icon: `TrendingUpIcon` (lucide-react). `App.tsx` renders `<InsightsView>` when `tab === "insights"`.

`InsightsView` is a single scrollable column matching `TodayView`'s shell (`px-4 pb-5 pt-7`). The top of the view holds a sticky segmented range selector `[7天 | 30天 | 90天 | 全部]`, default **30天**. Below it, three story sections in priority order:

1. **體重趨勢** (Reassurance) — weight chart + delta stats
2. **熱量達標** (Accountability) — calorie chart + adherence stats
3. **飲食習慣** (Awareness) — meal distribution + top foods + locations

### New files

- `src/views/insights-view.tsx` — orchestrates range state and renders the three sections.
- `src/components/insights/*` — one component per chart/stat block:
  - `weight-trend-chart.tsx`
  - `calorie-adherence-chart.tsx`
  - `meal-distribution-chart.tsx` (donut)
  - `top-foods-list.tsx`
  - `top-locations-list.tsx`
  - `range-selector.tsx`
  - `insight-stat-card.tsx` (shared mini-card)
  - `insight-empty-state.tsx` (shared empty hint)
  - `svg-chart-primitives.tsx` — reusable `<ChartAxis>`, `<ChartLine>`, scale helpers
- `src/lib/insights.ts` — pure, framework-free aggregation functions (rolling avg, adherence, distributions). Designed to be unit-testable.
- `src/hooks/use-insights.ts` — `useLiveQuery` wrappers that feed `weight_logs` + `diet_logs` into `lib/insights.ts` for the selected range.

### Reuse & non-changes

`BentoDashboard`, `WeightCard`, `TodayView`, `HistoryView`, `PresetsView`, `SettingsView` are unchanged except:
- `BottomNav` gains the new tab.
- `App.tsx` `Tab` type gains `"insights"` and a new render branch.
- `Profile` type and `profile-form.tsx` gain a `targetWeight` field (see Weight section).

### Bundle

Custom SVG only, no chart library. Per `AGENTS.md`, the app stays a single JS chunk — no code-splitting added.

## Range selector

A segmented control `[7天 | 30天 | 90天 | 全部]` sticky to the top of `InsightsView`. Default: **30天**. Selecting a range re-runs all aggregations for that window ending "today". The fixed ranges are `[today - N days, today]` (inclusive). **全部** is `[earliest log of that section's own data type, today]` — i.e. the weight section's 全部 starts at the earliest `weight_logs` entry, and the calorie/habits sections' 全部 starts at the earliest `diet_logs` entry. This keeps each chart tight to its own data and avoids long empty tails. The pure functions in `lib/insights.ts` are range-agnostic — they accept an already-filtered log array plus the range's `{ start: Date; end: Date }` (needed by the bar chart to render no-log days as ticks).

**Cold start:** when a user has fewer than ~7 days of data, 30天/90天 show a lot of empty space but this is acceptable and honest — the empty-state cards handle the extreme case (see per-section empty states).

## Section 1: 體重趨勢 (Weight trend)

### Stats row — 2 mini-cards

- **起始至今** — `(first weight in range − latest weight)` in kg, with +/- sign. Empty state: "尚未紀錄" if <2 weigh-ins in range.
- **有紀錄天數** — count of distinct days with a weigh-in within the range.

### Chart — custom SVG

- **Raw dots:** every weigh-in plotted as a small circle, faint (`text-muted-foreground/40`).
- **7-day rolling average line:** bold `stroke-primary` smooth path through the rolling mean. This is the reassurance line. Requires ≥2 points to draw.
- **Rolling average algorithm** (in `lib/insights.ts`, pure function `rollingAverageWeight(logs)`): for each weigh-in point at index `i`, average the weights of all points within the trailing **7 calendar days** inclusive of `i`. Calendar-window (not "last 7 points") so it handles sparse logging correctly. Output: `Array<{ date: Date; value: number }>`. If <7 points are available, the window shrinks to the available points — no NaN gaps.
- **Y-axis:** auto-scaled to data min/max ± small padding. Not fixed to 0 — weight loss needs to read as movement. Tick labels: min, max, current, in `tabular-nums`.
- **X-axis:** 4-5 evenly spaced date labels in `M/D` format (via existing `src/lib/date.ts`). No axis line — labels float.
- **Goal line:** dashed horizontal `stroke-primary/50` at the user's `targetWeight`, labeled with the value. Only rendered if `targetWeight` is set and falls within the chart's Y-range.

### Empty state

If `weight_logs` in range has <2 entries, the section shows a hint card: "開始記錄體重，連續一週後就能看到趨勢線" with a button that opens `WeightFormProvider` to log weight.

### Profile schema change — `targetWeight`

The `Profile` interface (`src/types/index.ts`) gains an optional field:

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

`src/components/profile-form.tsx` gains a "目標體重 (kg)" input. `isProfileComplete` in `src/lib/calorie-goal.ts` does **not** require `targetWeight` (it's optional; the goal line simply doesn't render when absent). Backup (`BackupData`) needs no change — `settings` already stores the whole `Profile` blob.

## Section 2: 熱量達標 (Calorie adherence)

### Stats row — 2 mini-cards

- **達標率** — % of days in range where daily total ≤ goal. Days with **zero** logs are excluded from the denominator (a newbie isn't penalized for unlogged days; we measure adherence *when they tried*).
- **日均熱量** — mean of daily totals across logged days in range, `kcal`.

### Chart — custom SVG vertical bars

- One bar per **day** in the range (daily calorie total). For 7/30 ranges bars are comfortable; for 90/全部 bars thin to ~2px and inter-bar gaps drop to 0.
- Days with no logs render as a faint baseline tick (not a zero bar) so gaps read as "didn't log," not "ate nothing."
- **Goal line:** dashed horizontal `stroke-muted-foreground` at the daily goal Y position, labeled with the goal value (`goal.toLocaleString('zh-Hant')`).
- **Bar color:** `fill-primary` when total ≤ goal; `fill-accent` (the existing "超標" shiso red) when over — reusing the bento's semantic colors.
- **Y-axis:** auto-scaled to `max(maxDailyTotal, goal) + padding`. Minimal tick labels.
- **X-axis:** `M/D` date labels at 4-5 evenly spaced points.

### Interaction

Read-only in v1. No tap-to-detail on bars — the History tab already serves day detail, and tooltips add scope. (Flagged for future iteration.)

### Empty state

If zero logged days in range → hint card: "還沒有飲食紀錄。回到今日新增第一筆吧！" with no button (Today is one tap away via the nav).

### Aggregation

`lib/insights.ts` pure function `dailyCalorieTotals(logs, range)` groups `diet_logs` by `dateKey(timestamp)`, sums `calories` per day, and joins against the range's day list (`range: { start: Date; end: Date }`), filling absent days as `null`, not `0`.

## Section 3: 飲食習慣 (Eating habits)

### Subsection A — 餐別分布 (Meal distribution)

- **Donut chart** (custom SVG) with 4 segments — 早餐 / 午餐 / 晚餐 / 零食 — sized by share of total calories in range. Reuses the `MEAL_ICON` emoji set and bento color semantics.
- **Center label:** total kcal across the range.
- **Legend:** 4 rows beside the donut — emoji + label + kcal + %.

### Subsection B — 常見食物 (Top foods)

- Ranked list, top 5, of distinct `food_name` values by total calories in range. Each row: rank number, `food_name`, total kcal, count of times logged.
- Read-only in v1 — no tap action (same rationale as calorie bars).

### Subsection C — 用餐地點 (Where you eat)

- Horizontal bar list of top `location` values by calorie share. Only locations with ≥1 log. Sorted descending. Each bar's width = share of total. `fill-primary`.
- **Hidden entirely** if every log has an empty `location` (common for newbies) — never show an empty section.

### Empty state

If zero `diet_logs` in range, the whole section shows the same hint card as the calorie section (one shared empty-state component for both lower sections since they share the data dependency).

### Aggregation

Pure functions in `lib/insights.ts`: `mealDistribution(logs)`, `topFoods(logs, n)`, `topLocations(logs)`.

## Data flow

```
IndexedDB (weight_logs, diet_logs, settings)
        │
        ▼
use-insights.ts  ── useLiveQuery ──▶ raw logs for selected range
        │
        ▼
lib/insights.ts  ── pure functions ──▶ derived metrics
        │
        ▼
InsightsView ──▶ section components ──▶ SVG charts
```

`useLiveQuery` (dexie-react-hooks) keeps everything reactive. Range changes re-run the query via the `dateKey(date)` dependency pattern already used in `use-weight-logs.ts`.

## Error handling

- All `useLiveQuery` hooks return `[]` / `undefined` fallbacks (matches existing hook pattern), so a missing table or empty DB never throws.
- Pure aggregation functions are total — they handle empty arrays and return zero-valued results, never throw.
- SVG chart components guard against empty data and render the shared empty-state instead.

## Testing

No test runner is configured in this project (`AGENTS.md`). The pure functions in `lib/insights.ts` are deliberately framework-free so they *could* be tested if a runner is added later. Verification for this work follows the standard order: `bun run lint` → `bun run build` → `bun run dev` at http://localhost:5173.

## Out of scope (v1)

- Tap-to-detail on any chart element (bars, donut, food rows, location bars).
- Body-fat or other biometric tracking.
- Forecasting / projected-weight lines.
- Export of chart images.
- Code-splitting the dashboard.
