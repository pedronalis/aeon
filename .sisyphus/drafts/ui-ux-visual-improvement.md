# Draft: UI/UX Visual Improvement

## Requirements (confirmed)
- User needs a project analysis and a plan to improve the visual design, optimized for UX/UI best practices.
- Priority is core flow first (Timer + navigation + Settings).
- Target audience: productivity/gamification fans; fantasy-light, premium tone.
- Design constraints: keep current medieval theme and tokens; refine only.
- Accessibility target: WCAG AA.
- Platform: desktop (Tauri) only.
- Verification strategy: manual QA only (no new test tooling).

## Technical Decisions
- TBD

## Research Findings
- Framework: React 19 + Vite + TypeScript (Tauri app shell)
- Styling: TailwindCSS with extensive custom theme tokens and bespoke utilities
- Theme/tokens: CSS variables and themed classes in `src/styles/globals.css`; extended palette/typography/animations in `tailwind.config.js`
- Primary screens: tabbed layout in `src/App.tsx` -> Timer, Stats, Quests, Tasks, Settings (`src/pages/*.tsx`)
- Shared UI components: `src/components/shared/Button.tsx`, `src/components/shared/Card.tsx`
- Visual style: “Medieval Premium” aesthetic (parchment panels, gilded gradients, torch/glow shadows)
- FX control: `data-fx="low"` to reduce animations/shadows
- Test infra: Vitest configured (`vitest.config.ts`, `src/test/setup.ts`); tests under `src/**/*.{test,spec}.{js,ts,jsx,tsx}`

## Open Questions
- None

## Scope Boundaries
- INCLUDE: UX/UI visual improvements and best-practice alignment across the existing app.
- EXCLUDE: Backend changes and new feature development unless required by UX improvements.
