# Agent Notes

Single-page React 19 app for personal dietary tracking. UI is in Traditional Chinese (`zh-Hant`).

## Toolchain

- **Package manager**: Bun (`bun.lock`).
- **Runtime commands**:
  - `bun run dev` — Vite dev server.
  - `bun run build` — Type-check (`tsc -b`) **and** production build (`vite build`).
  - `bun run lint` — Oxlint only.
  - `bun run preview` — Preview the production build.
- **No test runner** is configured.

## Important config quirks

- **React Compiler is enabled** in `vite.config.ts` via `@rolldown/plugin-babel` + `babel-plugin-react-compiler`. React 19 auto-memo behavior is in effect; do not add manual `useMemo`/`memo` unless you can prove it is required.
- **Tailwind CSS v4** is used with the `@tailwindcss/vite` plugin. In `src/index.css`, the import order must be:
  ```css
  @import "tailwindcss";
  @import "shadcn/tailwind.css";
  @import "tw-animate-css";
  ```
  Omitting `@import "tailwindcss"` produces a build with no utility classes and an unstyled UI.
- **Path alias**: `@/` maps to `./src`. Both `vite.config.ts` and `tsconfig.app.json` define it.
- **TypeScript strict flags** in `tsconfig.app.json`:
  - `verbatimModuleSyntax: true` — use `import type { ... }` for types.
  - `erasableSyntaxOnly: true` — no `enum` or `namespace`; use union types / `as const`.
  - `noUnusedLocals` / `noUnusedParameters` — unused imports and variables fail the build.
- **Lint**: Oxlint (`react/rules-of-hooks` is an error; `react/only-export-components` warns). shadcn-generated components trigger the latter by design and should not be edited just to silence the warning.

## shadcn/ui

- Components live in `src/components/ui` and are managed by `bunx --bun shadcn@latest`.
- `components.json` uses the `radix-nova` style, `lucide` icons, and the `@/` alias.
- After adding/updating shadcn components, verify the imports use the project alias (`@/components/ui/...`) and match the icon library (`lucide-react`).

## App architecture

- Entry: `src/main.tsx` mounts `src/App.tsx` into `index.html#root`.
- Routing is view-state based inside `App.tsx` (bottom tab bar switches between Today / Presets / Settings; History overlays Today).
- Shared log-form drawer is provided by `src/components/log-form-context.tsx`.
- Data layer: Dexie.js IndexedDB in `src/db/db.ts`, reactive queries via `dexie-react-hooks`.
- Backup/export logic is in `src/lib/backup.ts`.

## Verification order

Run in this order before finishing a change:

1. `bun run lint`
2. `bun run build`
3. `bun run dev` and load `http://localhost:5173`

## Gotchas

- The dev server may start on a different port if `5173` is in use; check the terminal output.
- Do not delete or rename `src/index.css` imports without confirming Tailwind still loads.
- The production build emits a single large JS chunk (~550 KB gzipped). This is expected for a small SPA; do not add code-splitting unless asked.
