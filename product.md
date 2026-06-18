# Product: Personal Sprint Manager

## Core Purpose

Personal, single-user productivity tool built around **"Inbox Zero for Tasks"** — automated weekly sprint cycles force prioritization and keep the active workspace clean. Not intended for public release.

## Stack

- **Frontend**: React + Vite PWA — installable to iOS Home Screen via Safari, no App Store needed
- **Backend**: Supabase (PostgreSQL)
- **Offline Layer**: IndexedDB (Dexie.js) + custom offline sync queue
- **Animations**: Framer Motion (gestures, layout transitions, enter/exit) + AutoAnimate (simple list tables) + Tailwind transitions (micro-interactions)

All reads/writes execute instantly against local IndexedDB. A background sync queue pushes mutations to the cloud when online. Pending mutations survive force-close and sync on next launch.

## Sprint Cycle

Sprints run **Saturday–Friday** (7 days). Automated rollover at **Saturday 00:00** — incomplete tasks in Current move to Next; a new sprint is generated.

**Trigger**: checked on app open. All Fridays missed since the last rollover are executed in sequence before the UI renders. Rollover writes to IndexedDB first and syncs via the normal queue.

| Label | Description |
|-------|-------------|
| Past | Archived sprints |
| Previous | Most recently finished sprint |
| **Current** | Active working week |
| Next | Upcoming week (planning) |
| Future | Backlog / horizon |

## Entities

### Task
- **Core**: emoji, title, status, assigned sprint, goal link
- **Time**: `eventDate` (hard deadline/appointment), `snoozeDate` (visibility toggle)
- **Context**: Markdown description, source URL, duration

### Goal
Quarterly objective: title, emoji, quarter (e.g. `"26 Q3"`), Markdown summary, linked tasks.

## Views

| View | Description |
|------|-------------|
| **Current Sprint** | Default view. Incomplete tasks for active week, ordered: In Progress → To-Do |
| **Next Sprint** | Tasks planned for the upcoming week |
| **Planning** | All incomplete tasks — sprint-assigned and unassigned — ordered by Sprint → Status. Shows both what is planned and what still needs a sprint. |
| **All Tasks** | Cursor-paginated table. Filter by Goal/Status (including Completed), full-text search, sort by `createdAt` for mass cleanup |
| **Goals** | Aggregated progress (completed / total tasks). Inline create/rename, multi-select delete |
| **Sprints** | Read-only history. Delete past or distant-future sprints to clear clutter |

## UX Rules

### General
- No Save/Cancel buttons — changes auto-persist on blur/state change
- Subtle sync indicator in the header (non-blocking)
- Keyboard shortcuts explicitly visible in the UI

### Task Entry
- **Desktop**: New Task opens a bottom row. Fuzzy completions suggested from existing task names and goal names; Tab to accept, Enter to save and open the next row.
- **Mobile**: Accessory toolbar for acceptance; Return saves and keeps input active.

### Natural Language Parsing

The raw input string is never modified while the user types. Instead, each recognised token is **color-coded in place** and a small badge floats above it showing the resolved value (e.g. `Mon` → `18 Jun`, `2h` → `7 200s`, `#write` → `Writing`). On Enter the string is decomposed: unparsed words become the title, everything else goes to its field. To edit a field after saving, interact with that column directly — the raw string is not re-shown.

**Parsed tokens**

| Token | Field | Example → Resolved |
|-------|-------|--------------------|
| Leading emoji | `emoji` | `🏋️ Gym Mon` → emoji: 🏋️ |
| Date / time (see formats below) | `eventDate` | `1st June 12:00` → ISO datetime |
| Status keyword (see list below) | `status` | `progress` → IN_PROGRESS |
| `@Mon`, `@tmrw`, `@1st June` | `snooze` (absolute ISO date) | hidden until that date; `@Mon` resolves to the *next* Monday |
| `@1d`, `@2h` | `snooze` (relative to now, ISO date) | hidden for that duration from now |
| `@-1d`, `@-2h` | `snooze` (relative to event, stored as `"-{seconds}"`) | hidden until N before `eventDate`; requires `eventDate` — blocked if missing |
| `30m`, `1h`, `1h30m`, `1.5h` | `duration` (seconds) | `1h30m` → 5 400 |
| `#prefix` | `goalId` | fuzzy-matched against existing goal names |
| Bare URL | `sourceUrl` | stripped from title automatically |

Sprint assignment is **context-driven** — new tasks inherit the sprint of the active view. No parsing token needed. The Planning view is an exception: new tasks default to unassigned (`sprintId = null`) so they appear in the unassigned bucket.

**General rule**: a newly created task must always appear in the view it was created from. It inherits whatever filters that view implies (sprint, goal, status, etc.).

**Supported date formats**

| Format | Example |
|--------|---------|
| Day of week (+ optional time) | `Monday 12`, `Tue 13:12`, `Wed` |
| Ordinal date (+ optional time) | `1st Apr`, `3rd June`, `4th December 13:12` |
| DD.MM HH:MM | `01.06 12:00` |
| Relative | `today 12:00`, `tmrw 13`, `tomorrow 18:19` |

**Supported status tokens** (case-insensitive)

| Token(s) | Status |
|----------|--------|
| `todo`, `to do` | TODO |
| `next` | NEXT |
| `progress`, `in progress` | IN_PROGRESS |
| `done` | DONE |
| `archive` | ARCHIVED |

### Snooze
- Global **Show Snoozed** toggle. Snoozed tasks appear ghosted (reduced opacity).
- Snoozed tasks are fully interactive while visible — no need to un-snooze before acting.

### Duplication (Cmd+D)

All fields are copied. `name` gets ` 1` appended; if that name already exists, increment until a unique name is found (`name 2`, `name 3`, …).

### Keyboard Shortcuts (Desktop)

| Shortcut | Action |
|----------|--------|
| Hover → checkbox | Reveal per-row checkbox; click to select |
| Shift + click | Select all rows between last selected and clicked |
| Shift + ↑ / ↓ | Extend selection by one row |
| Cmd+D / Ctrl+D | Duplicate selected |
| Backspace | Delete selected |
| 1–4 | Set status |

### Mobile Gestures
- **Swipe right**: Mark Done
- **Swipe left**: Quick-snooze menu

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
