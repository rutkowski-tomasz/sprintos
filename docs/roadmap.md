# Roadmap

## Phase 1 — Infrastructure & Sync POC

**Goal**: Prove the custom offline queue and real-time streaming work before building UI. Set up deployment pipeline.

| # | Task | Done When |
|---|------|-----------|
| ✅ 1 | Bootstrap Vite + React + TS; install Tailwind, lucide-react, shadcn/ui, Framer Motion, AutoAnimate | App compiles, renders a Tailwind screen |
| ✅ 2 | Supabase client + Email/Google Auth UI | User can log in and receive a session token |
| ✅ 3 | Dexie.js IndexedDB setup — `test_tasks` + `sync_queue` tables | Tables visible in DevTools → IndexedDB |
| ✅ 4 | Offline write: submit → Dexie instantly; if offline → enqueue mutation | Going offline and submitting updates UI + adds to `sync_queue` |
| ✅ 5 | `online` listener flushes queue to Supabase, clears on success | Re-enabling network clears queue and updates Supabase |
| ✅ 6 | Supabase Postgres Changes subscription → updates local Dexie | Edit in Window A instantly reflects in Window B |
| ✅ 7 | GitHub Actions CI: `tsc --noEmit` + `pnpm test` on every push to `main` | A push with a failing type or test is flagged in GitHub before anything deploys |
| ✅ 8 | GitHub Actions CD: build + deploy to GitHub Pages on every push to `main`; add `404.html` SPA redirect | Pushing to `main` publishes the app; reloading any route (e.g. `/current`) returns the app, not a 404 |
| ✅ 9 | PWA: `vite-plugin-pwa`, web manifest, asset caching | Lighthouse PWA passes; iOS Safari prompts Add to Home Screen |

## Phase 2 — Core Data & State

**Goal**: Evolve POC into the real schema from `data_model.md`.

| # | Task | Done When |
|---|------|-----------|
| ✅ 10 | Apply production schemas to Supabase and Dexie | Cloud and local structurally match the data model |
| ✅ 10a | Row Level Security: enable RLS on all tables (`goals`, `sprints`, `tasks`); add `USING (user_id = auth.uid())` policies for SELECT/INSERT/UPDATE/DELETE | Authenticated user A cannot read, write, or delete any row owned by user B — verified by querying with a second account's JWT |
| ✅ 11 | `react-router-dom` + Protected Route; unauthenticated → `/login` | Visiting `/` without session redirects to `/login` |

## Phase 3 — Engine

**Goal**: Core business logic, no UI.

| # | Task | Done When |
|---|------|-----------|
| ✅ 12 | Sprint engine: derive Previous/Current/Next/Future from date boundaries + Friday midnight rollover | Unit tests confirm date inputs map to correct sprint state |
| ✅ 13 | NL parser: extract `emoji`, `eventDate`, `status`, `snoozeDate` (all 3 modes), `duration`, `#goal`, bare URLs | `"🏋️ Vet 1st June 12:00 progres @-1d 30m #health"` returns correct metadata for all fields |

## Phase 4 — UI

**Goal**: Build all views per the product spec.

| # | Task | Done When |
|---|------|-----------|
| ✅ 14 | Persistent sidebar + route shell (Current, Next, Planning, All Tasks, Goals, Sprints) | Navigation between empty route views works |
| ✅ 15 | Reusable Task list component: status colours, description icon, Framer Motion enter/exit/reorder animations | Mock data renders and animates per spec |
| ✅ 16 | Current Sprint + Next Sprint views wired to live Dexie queries | Correct tasks appear in each view; status ordering correct |
| ✅ 17 | Planning view: all incomplete tasks grouped by assigned sprint + unassigned bucket, ordered Sprint → Status | Unassigned and sprint-assigned tasks both appear, correctly grouped |
| 18 | Bottom-row rapid entry + live NL parser: tokens colour-coded in place, resolved-value badges | Enter saves to Dexie, opens new row; badges show correctly |
| 19 | Inline cell editing (Title, Status, Dates) — auto-save on blur | Click title → input; click away → saved. No Save buttons. |
| 20 | Multi-select + desktop shortcuts: Cmd+D, Backspace, 1–4 | Selecting rows and pressing Backspace soft-deletes them locally |
| 21 | Show Snoozed toggle + ghosted opacity (Tailwind transition) | Toggle hides/shows tasks where `snoozeDate` is in the future |
| 22 | Mobile gesture layer: swipe right → Done, swipe left → quick-snooze menu (Framer Motion drag) | Swiping a task card triggers correct action with spring snap-back |
| 23 | Native-feel CSS globals + view slide transitions | No rubber-band scroll, no tap flash; navigating views slides smoothly |

## Phase 5 — Extra Views & AI

**Goal**: Remaining views and AI completions.

| # | Task | Done When |
|---|------|-----------|
| 24 | All Tasks view: cursor pagination, Goal/Status filter, full-text search, sort by `createdAt` | User can view and mass-delete historical tasks |
| 25 | Goals table: inline editing, aggregate task counts, multi-select delete (unlinks tasks, doesn't delete them) | Modifying goal name persists; deleting unlinks without removing tasks |
| 26 | Sprints view: read-only history table, delete past/distant-future sprints | User can delete clutter sprints; Current and Next are protected |
| 27 | AI completions (Gemini Flash free tier): send input + sprint/goal context, suggest task title; Tab to accept | Typing while online shows an AI-suggested completion |
