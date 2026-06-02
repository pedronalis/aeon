# Aeon

Medieval-themed Pomodoro web app. React SPA with gamification (XP, levels, quests, achievements) and local IndexedDB persistence.

# IMPORTANT

- Timer tick runs via `setInterval` inside `useTimerStore.ts` — **never** move tick logic into React effects or `useEffect` intervals.
- All dates in domain/storage are **YYYY-MM-DD strings** via `formatDate()` — never use raw `Date.toISOString()` for storage fields.
- UI strings are in **PT-BR** (`pt-BR`). Keep accents and medieval tone (e.g. "pergaminho", "ritual", "chama").
- Stores read/write to IndexedDB via `idb-keyval` in `src/lib/storage.ts` — do NOT add a real database or backend API.

# Build & Test

- Dev server: `npm run dev` (Vite, port 3000)
- Build: `npm run build` (`tsc && vite build`)
- Test: `npm test` (Vitest with happy-dom)
- Test single: `npx vitest run <path>`
- Coverage: `npm run test:coverage`
- Preview: `npm run preview`

# Architecture Overview

Single-page React app with tab-based routing (Timer / Crônica / Missões / Pergaminhos / Reino). State is managed by domain-specific Zustand stores that persist to IndexedDB via a thin wrapper around `idb-keyval`.

**Data flow:**
1. `TimerEngine` (pure class, anti-drift via `Date.now()`) → `useTimerStore`
2. On phase complete, `handlePhaseComplete` in `useTimerStore.ts` orchestrates cross-store updates: quests, stats, XP, user progress, active task, and notifications
3. Other stores (`useTasksStore`, `useQuestsStore`, etc.) read/write directly to IndexedDB and reload into memory

**Directory layout:**
- `src/domain/` — pure business logic (engines, types, achievements, presets). No React, no storage side effects
- `src/store/` — Zustand stores. `useTimerStore` owns the interval loop; others are async data shells
- `src/components/` — UI components grouped by feature (`timer/`, `tasks/`, `gamification/`, `shared/`, `notifications/`, `user/`)
- `src/pages/` — top-level page components mapped to tabs
- `src/lib/` — storage wrapper (`storage.ts`) and IndexedDB migrations (`db-migrations.ts`)
- `src/hooks/` — shared React hooks (e.g. keyboard shortcuts)

# Code Conventions

- Path alias: `@/` maps to `./src/`. Use it for all cross-folder imports
- Strict TypeScript: `noUnusedLocals` and `noUnusedParameters` are enabled — unused vars will fail the build
- Tailwind theme uses custom medieval palette (`background`, `surface`, `primary`, `accent`, `text`, `border`, etc.) and custom shadows prefixed `torch-*` and `elevation-*`
- Font tokens: `font-display` (Cinzel for titles), `font-heading` (Inter), `font-body` (Inter), `font-mono` (JetBrains Mono for timer digits)
- Timer text sizes (`timer-sm`, `timer-md`, `timer-lg`) use `fontVariantNumeric: tabular-nums` to prevent digit wobble

# Testing

- Framework: **Vitest** with **happy-dom** and **@testing-library/react**
- Setup file: `src/test/setup.ts` (jest-dom matchers + `window.matchMedia` mock)
- Tests live next to source: `src/**/*.test.{ts,tsx}`
- Only `TimerEngine.test.ts` exists today — the store layer is currently untested

# Security & Persistence

- No auth, no API keys, no remote backend
- All user data stays in browser IndexedDB via `idb-keyval`
- IndexedDB keys are prefixed with `aeon:` to avoid collisions
- `DB_KEYS` in `src/lib/storage.ts` is the single source of truth for key names

# Git Workflow

- Commit messages are concise and imperative (e.g. `feat: add quest reset`, `fix: handle null profile`)
- One contributor (`Pedro Guina Saltareli`) — no branch conventions enforced yet

# Gotchas

- **Timer anti-drift**: `TimerEngine` calculates elapsed time from `Date.now()` diffs, not `setInterval` accumulation. The store resets `startTimestamp` after each tick to maintain accuracy
- **Overdue penalties** run every 10 minutes via `setInterval` in `App.tsx`, and once at app init. They mutate `totalXp` and can trigger toast notifications
- **Subtask XP rebalance**: adding/removing a subtask recalculates XP per subtask for all siblings and adjusts the user's total XP. Max 10 subtasks per task
- **Low-fx mode**: controlled by `localStorage` key `aeon-low-fx` and `document.documentElement.dataset.fx`. Prefer `opacity`-based animations (GPU-composited); avoid `filter: brightness` which causes full repaints
- **Notifications require user interaction first**: Web Notification API only works after a user gesture; the store calls `ensureWebNotificationPermission()` on timer start/resume
- **Completion sound** loads `/sounds/complete.wav` lazily and caches the `AudioBuffer` in a module-level variable
- **XP toast merging**: consecutive XP toasts with the same title/description are merged in `useNotificationsStore` instead of stacking
- **Skip vs Finish**: `skip()` increments `completedPomodoros` and marks state `FINISHED`, then `handlePhaseComplete` runs the same post-focus logic as a natural completion

# IMPORTANT

- Timer tick runs via `setInterval` inside `useTimerStore.ts` — never move tick logic into React effects.
- All dates in storage are **YYYY-MM-DD** via `formatDate()`.
- UI strings are **PT-BR** with medieval tone.
