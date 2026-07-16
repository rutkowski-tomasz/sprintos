# Product: Personal Sprint Manager

## Core Purpose

Personal, single-user productivity tool built around **"Inbox Zero for Tasks"** — automated weekly sprint cycles force prioritization and keep the active workspace clean. Not intended for public release.

## Stack

- **Frontend**: React + Vite PWA — installable to iOS Home Screen via Safari, no App Store needed
- **Backend**: Supabase (PostgreSQL)
- **Offline Layer**: IndexedDB (Dexie.js) + custom offline sync queue
- **Animations**: Framer Motion (gestures, layout transitions, enter/exit) + AutoAnimate (simple list tables) + Tailwind transitions (micro-interactions)

All reads/writes execute instantly against local IndexedDB. A background sync queue pushes mutations to the cloud when online. Pending mutations survive force-close and sync on next launch.

### Sync & Data Rules

- **IDs**: Client-generated UUID v7 (time-ordered). Created locally before any network sync.
- **Conflicts**: Records carry a `version` integer. On mismatch, the local queue drops the update and pulls the latest server state.
- **Queue collapsing**: Multiple offline edits to the same entity collapse into one update with the latest local state.
- **Soft deletes**: All entities use `deletedAt`. All records require `createdAt` and `updatedAt`.

## Sprint Cycle

Sprints run **Saturday–Friday** (7 days). The current sprint, previous, next, and all past/future sprints are derived from the current date — no sprint entities are created or stored.

Each task carries a `sprint` field: a normalized key like `"26 Q2 11"` (11th week of Q2 2026) or `null` if unassigned. Sprint labels are computed at read time.

**Rollover**: checked on app open. Any incomplete task assigned to a sprint key before the current sprint is moved to the current sprint key.

| Label | Description |
|-------|-------------|
| Past | Sprint keys before previous |
| Previous | Last completed sprint |
| **Current** | Active working week |
| Next | Upcoming week (planning) |
| Future | Backlog / horizon |

## Entities

### Task
- **Core**: emoji, title, status, assigned sprint key, goal link
- **Time**: `eventDate` (hard deadline/appointment), `snooze` (visibility toggle)
- **Context**: Markdown description, source URL, duration (seconds)
- `snooze` is either an ISO date string or `"-{seconds}"` (offset relative to `eventDate`, e.g. `"-86400"` = −1 day before it)
- When `eventDate` changes, any `snooze` starting with `"-"` is recalculated against the new date. Absolute ISO snooze values are unaffected.
- Resolved snooze must always precede `eventDate`. `@-Nd/h` tokens require `eventDate` — blocked in UI if missing.

### Goal
Quarterly objective: title, emoji, quarter (e.g. `"26 Q3"`), Markdown summary, linked tasks. Goal names are unique. Deleting a Goal nullifies `goalId` on all linked tasks.

## Views

| View | Description |
|------|-------------|
| **Current Sprint** | Default view. Incomplete tasks for active week, ordered: In Progress → To-Do |
| **Next Sprint** | Tasks planned for the upcoming week |
| **Planning** | All incomplete tasks — sprint-assigned and unassigned — ordered by Sprint → Status. Shows both what is planned and what still needs a sprint. |
| **All Tasks** | Cursor-paginated table. Filter by Goal/Status (including Completed), full-text search, sort by `createdAt` for mass cleanup |
| **Goals** | Aggregated progress (completed / total tasks). Inline create/rename, multi-select delete |
| **Settings** | Avatar/initials, name, email, language preference (English US / Polish — stored only, does not affect app locale yet), sign out |

## Display Labels

Full form always available as a tooltip. Omit context that matches today:

| Full form | Current year | Current year + quarter |
|-----------|-------------|------------------------|
| `26 Q3` | `Q3` | `Q3` |
| `26 Q2 11` | `Q2 11` | `11` |

### Sprint Chip

Every on-screen reference to a task's `sprint` renders through `SprintChip` (`src/features/properties/sprint/SprintChip.tsx`) — no other component formats a sprint value directly. Format: `Sprint {display} · {relative label}` (e.g. `Sprint 01 · current`, `Sprint Q2 01 · future`, `Sprint 27 Q1 01 · future`), relative label lowercase (`current` / `next` / `future` / `previous` / `past`). If `sprint` is `null`, renders a `muted` chip reading `Backlog`. Color is keyed by relative label via `SPRINT_LABEL_COLOR` (`sprintDef.ts`) — the same map colors the `ViewHeader` hero's `SprintBadge`, so the two visual treatments always agree. The `ViewHeader` hero (giant week number, vertical "SPRINT" label, swipe indicators) is a distinct, intentionally larger navigational treatment and does not use `SprintChip`, but shares its underlying `formatSprintKey`/`classifySprintKey`/`sprintWeekNumber` parsing so the data never drifts.

## UX Rules

### General
- No Save/Cancel buttons — changes auto-persist on blur/state change
- Subtle sync indicator in the header (non-blocking)
- Keyboard shortcuts explicitly visible in the UI

---

## Further Research

### Embedding Model Upgrade

Current emoji/task search uses a local embedding model. Candidate upgrade:

| Model | Source | Size | Dims | Context | Notes |
|-------|--------|------|------|---------|-------|
| `google/EmbeddingGemma` | `onnx-community` | ~200 MB | 768 | 2048 tokens | Multilingual (100+ langs), highest quality |

Worth evaluating for improved multilingual accuracy in task title search and emoji matching.

---

## Command Bar

The command bar is a persistent input at the bottom of the screen. On mobile, it occupies ~80% of the bottom bar width; the left ~20% is the hamburger menu. It is the single entry point for both search and task creation — no mode toggle exists.

### Layout (mobile, bottom of screen)
```
[ ☰ ] [ command bar input                    ]
```

While the command bar is focused:
- **Matching/recent tasks** take over the full page content area (not a floating overlay) — replacing the current view for the duration of the search.
- Tapping a matching-task row navigates to that task's detail page (`/sprint/<key>/<taskId>` for sprint-assigned tasks) and closes the search. The trailing icon button (copy-to-input arrow) still copies the title into the command bar for a similar new task, and stops the row's navigation.
- **Task preview** (the task about to be created, plus the emoji/duration suggestion row) stays as a floating card anchored just above the input, matching the old overlay style. It is collapsible/expandable via a header toggle, so the user can dismiss it to search undistracted without losing their typed input.

---

### Search

- Typing with no parsed tokens performs live task search by title.
- Filtering is sprint-based: results can be scoped to current sprint, next sprint, or backlog via chips or swipe-filters.
- Advanced field-based search (e.g. `eventDate > X`) is not supported.

---

### Share Target

The PWA registers as an OS share target (`share_target` in the manifest, GET method, action `/sprintos/share`) — on iOS 16.4+, once installed to the Home Screen, SprintOS appears in the native share sheet from other apps (e.g. sharing a YouTube video).

- `SharePage` (`src/features/share/SharePage.tsx`) receives the shared `title`/`text`/`url` query params, resolves a task name (shared title, else shared text with any URL stripped out, else the URL itself), and creates the task immediately — no confirmation step, matching the "no Save/Cancel" rule.
- If the shared URL is a YouTube link and no title was provided, the name is looked up via YouTube's oEmbed endpoint. No general metadata (e.g. duration) is fetched for other sites.
- The task is assigned to the current sprint; the user lands on its detail page immediately after creation to edit further.
- iOS caches the manifest at install time — a `share_target` addition requires removing and re-adding the Home Screen icon to take effect.

---

### Task Creation

#### Input behavior

- The command bar is always a raw text input. No chips or block elements inside it.
- The parser runs continuously as the user types. It never modifies the raw text.
- Recognized tokens are highlighted in place (colored background or text color).
- The parser is greedy: once it starts matching a token it tries to extend it (e.g. `Monday` waits for a following time before committing).
- Token commit triggers: user starts a clearly different token type, types `#`, or submits (Enter).
- No element jumps position. No text is rewritten or reordered.

#### State model

A parallel shadow object holds resolved references alongside the raw string:

```ts
{
  raw: string,
  resolved: {
    goalId: string | null,
    eventDate: string | null,
    duration: number | null,   // seconds
    emoji: string | null,
    status: Status | null,
  }
}
```

On submit: title is derived from the raw string minus all confirmed tokens (gaps collapsed). Goal comes from the shadow field, not re-parsed from the string.

#### Title

- Title = all input text not claimed by a parsed token, joined in original order with gaps collapsed.
- Example: `"workout Monday 17:00 leg/fullbody"` where `Monday 17:00` is parsed → title: `"workout leg/fullbody"`.

#### Emoji

- Detected anywhere in the input, not just leading position.
- Extracted for the data model but not moved visually — stays at the typed position.
- No dedicated slot. No jumping behavior.

#### Event date

- Parsed from bare date/time patterns. No prefix token required.
- Supported formats:

| Format | Example |
|--------|---------|
| Day of week (+ optional time) | `Monday 12`, `Tue 13:12`, `Wed` |
| Ordinal date (+ optional time) | `1st Apr`, `3rd June`, `4th December 13:12` |
| DD.MM HH:MM | `01.06 12:00` |
| Relative | `today 12:00`, `tmrw 13`, `tomorrow 18:19` |

- Parser waits to commit — `Monday` stays highlighted but uncommitted while a time could still follow.
- Commits when the next input is clearly a different token type or on submit.
- Ambiguity rule: a bare number extends a date token only if it appears immediately after a day word with nothing else between them. `Monday 17` → extends. `Monday clean 17` → `Monday` commits as date, `17` is title text.

#### Duration

- Parsed from bare duration patterns: `30m`, `1h`, `1h30m`, `1.5h`. No prefix required.
- Commits immediately on recognition.

#### Snooze

- Not supported in the creation input. Snooze is an editorial action applied after a task exists (swipe left → quick-snooze menu).

#### Status

- Parsed from reserved keywords (case-insensitive):

| Token(s) | Status |
|----------|--------|
| `todo`, `to do` | TODO |
| `next` | NEXT |
| `progress`, `in progress` | IN_PROGRESS |
| `done` | DONE |
| `archive` | ARCHIVED |

#### Sprint

- Defaults to the active view context; a recognized sprint token in the input overrides it.
- Planning view exception: new tasks default to unassigned (`sprint = null`).
- Token formats: `S01` (week-only, resolves to the nearest current-or-future sprint with that week number), `Q203` (quarter+week, same nearest-upcoming resolution), `26Q103` (exact year+quarter+week). Case-insensitive.
- Keyword shorthand: `scurrent`, `snext`, `sprevious`, `sfuture` (two sprints ahead), `spast` (two sprints behind) — resolved relative to today, same offsets as the `/current` `/next` `/previous` `/future` `/past` commands.

#### Goal

- Requires `#` prefix. Goal names overlap with title words and cannot be auto-detected.
- Typing `#` opens a goal search dropdown, replacing the suggestion row.
- Search is fuzzy and mid-word — user does not need to start from the first word.
- Goal names are unique — exact string match always maps to exactly one goal.
- On selection: `#searchterm` in the input is replaced with `#CanonicalGoalName`, highlighted as confirmed. The goal ID is written to the shadow field.
- If the user backtracks into the `#` token: shadow field is cleared, text becomes muted, dropdown reopens.
- If the edited text exactly matches a goal name: shadow field is auto-restored, text re-colors. No manual re-selection needed. Auto-confirm fires only when no goal with a longer matching name exists in the dropdown.
- If `#something` is submitted with no selection: goal is null, `#something` absorbed into title with `#` stripped.

#### Commands

- `/` as the first character switches the bar to command mode — task parsing/preview is suspended for as long as the input starts with `/`.
- Supported: `/current`, `/next`, `/previous`, `/future` (sprint after next), `/past` (sprint before previous), `/backlog`, `/settings`. Each navigates immediately on activation; none take arguments.
- Matching is by prefix against the typed text (e.g. `/p` matches both `/previous` and `/past`). Matches render in a dropdown above the bar, topmost match highlighted by default.
- Arrow Up/Down move the highlight (wraps at the ends); Enter activates the highlighted command. Mouse/tap selects directly.

---

### Preview Panel

- Appears as soon as any text is typed. Hidden only when the bar is empty.
- Two rows:
  - **Title row** — live resolved title
  - **Property strip** — every supported field shown always

- Empty fields display: `No emoji`, `No date`, `No goal`, `No duration`
- Fields shown in priority order, strip scrolls horizontally. Fixed height — never reflows layout.
- Status and sprint excluded from strip (status defaults to To-Do, sprint is context-driven).

---

### Suggestion Row

- Sits above the keyboard, below the preview. Fixed height, horizontal scroll.
- Default chips (unfilled fields only): emoji suggestion (if similar past task found) · `📅 Date` · `⏱ Duration` · `🎯 Goal`
- Emoji, Date, and Duration chips are sourced from the top similar past tasks (by title embedding). Date and Duration each surface up to 3 deduped candidates; Date resolves each candidate's weekday + time-of-day to its next upcoming occurrence (never today's/this week's if already past). Goal suggestion not yet implemented.
- When `#` is typed, suggestion row is replaced by the goal search dropdown.
- Accepting a suggestion inserts its raw token text into the input at cursor position. Parser picks it up naturally.
- A field's chip is removed from the row once that field is filled.

---

## UX Rules (continued)

### Snooze
- Global **Show Snoozed** toggle. Snoozed tasks appear ghosted (reduced opacity).
- Snoozed tasks are fully interactive while visible — no need to un-snooze before acting.
- The "Reschedule" sheet (`RescheduleSheet`, swipe left) covers two distinct actions grouped under headers with a leading icon (moon for snooze, arrow for sprint move): **Snooze** (hide until a time, same sprint) and **Move to sprint** (reassign the task's `sprint`).
- Snooze options: Evening (18:00), Tomorrow (08:00), Day after tomorrow (08:00). Each is only offered while its resolved date stays within the current sprint — once it would cross into the next sprint, it's dropped in favor of the move options below.
- Move options: Next sprint / Future sprint (Saturday 08:00 of the following/following-following sprint; subtext shows the target sprint as a `SprintChip`), Backlog (clears both `sprint` and `snooze`, unassigning the task entirely, shown via `SprintChip` with `sprint={null}`).
- Custom uses a single native `datetime-local` input, defaulting to tomorrow 08:00. It performs exactly one action based on the chosen date: if it falls within the current sprint it snoozes; otherwise it moves the task's `sprint` to match (clearing `snooze`, no dual snooze+move). The submit button's label reflects which action will run (e.g. "Snooze" vs "Move to" + a `SprintChip`).
- Preset options (not custom) that cross into a different sprint than the task's current one show a "Moves to" + `SprintChip` note and set `sprint` and `snooze` together when selected.

### Duplication (Cmd+D)

All fields are copied. `name` gets ` 1` appended; if that name already exists, increment until a unique name is found (`name 2`, `name 3`, …).

### Desktop Task List (Table)

Below the `lg` breakpoint (1024px, via `useIsMobile`) the task list renders as the mobile card list described below. At or above it, `TaskList` renders `TaskTable` instead — a data table (`src/components/ui/table.tsx`) sharing the same underlying selection/sort/group state as the mobile view.

- Columns: select checkbox, emoji, name, event date (+ misalignment warning), status, sprint, duration, goal, url/description presence icons, open-detail chevron.
- Selection: a checkbox per row (always visible, no long-press gating) plus a header checkbox for select all/none. Selecting one or more rows shows a toolbar above the table with the count and **Change status** / **Move** / **Delete** actions — the same `MassStatusSheet`/`MassMoveSheet`/`deleteTasks` used on mobile.
- Editing status or sprint: click directly on the Status or Sprint cell to open that property's picker inline (`StatusPicker`/`SprintPicker`, unchanged from mobile).
- Opening a task: click the trailing chevron button — clicking elsewhere on the row does not navigate, since status/sprint cells need their own click target.
- Sprint grouping and the snoozed-tasks toggle mirror the mobile list's behavior, rendered as table rows instead of `<div>`s.

Not yet implemented: hover-to-reveal checkboxes, shift+click range select, shift+↑/↓ to extend selection, Cmd+D/Backspace/1–4 row-level keyboard shortcuts, Cmd+P command bar focus shortcut.

### Mobile Gestures
- **Swipe right**: Opens a bottom sheet to change status (all statuses listed, current one checked)
- **Swipe left**: Opens the quick-snooze bottom sheet
- **Tap** a row: opens the task detail page
- **Hold** a row: enters multi-select mode with that row selected
- **Swipe the sprint header right → left**: navigate to the next sprint; **left → right**: navigate to the previous sprint. While dragging, a chevron plus "Go to Sprint NN" label fades in on the revealed edge, brightening from muted gray to purple as the drag crosses the threshold. Drag under the distance/velocity threshold snaps back with no navigation.

### Task Detail
- A routed page (`/sprint/:key/:taskId`), not a modal — deep-linkable, back button and swipe-from-left-edge both navigate to the list.
- Slides in from the right; the underlying tab (sprint/backlog) does not re-transition or remount when opening/closing it.
- Shows every property, including `sourceUrl` and `description` (not shown on the list row). Name, event date, duration, and link render as read-only text/buttons until clicked, then switch to an editable input that saves on blur; description is always a live textarea. Pickers (status, sprint) save immediately on selection, no click-to-edit gate.
- Description has no input border — it fills the remaining vertical space like a notes field.
- The Snooze field opens `RescheduleSheet` in `snoozeOnly` mode: snooze options only, no sprint-move options (sprint has its own picker on the same page).

### Multi-Select (Mobile)
- Long-press (~500ms, canceled by ~10px of movement) enters select mode; the pressed row shows a weaker highlight while the hold is registering, full highlight once selected.
- Select-mode toolbar (top, sticky): back button + selection count on the left; Select all / Deselect all toggle and icon buttons for **Change status** and **Move** (sprint/backlog) on the right. The mass-action icons are disabled until at least one row is selected.
- Deselecting the last selected row exits select mode automatically, same as the back button.

### Animation & Native Feel

**Principles**: all state changes are animated. Animations use spring physics (via Framer Motion defaults) — never linear easing, which reads as "web".

| Trigger | Animation |
|---------|-----------|
| Task created | Slide in from bottom |
| Task deleted / completed | Fade + height collapse |
| Task status change | Background colour transition |
| List reorder | Smooth layout transition (`layout` prop) |
| Snoozed task shown/hidden | Opacity fade |
| View navigation | Slide transition between routes |
| Swipe gesture | Real-time drag with spring snap-back or completion |

**Native-feel CSS (applied globally)**

```css
overscroll-behavior: none;           /* kills browser rubber-band scroll */
-webkit-tap-highlight-color: transparent; /* removes iOS grey tap flash */
user-select: none;                   /* no accidental text selection on rows */
```

`touch-action` scoped to gesture zones only, to prevent scroll/swipe conflicts.
