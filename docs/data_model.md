# Data Model

## Architecture

| Concern | Rule |
|---------|------|
| **Auth** | Standard provider. All records include `userId`. |
| **IDs** | Client-generated UUID v7 (time-ordered). IDs are created locally before any network sync — no server remapping needed. |
| **Conflict Resolution** | Records carry a `version` integer. On sync conflict (version mismatch), the local queue drops the update and pulls the latest server state. |
| **Queue Collapsing** | Multiple offline edits to the same entity collapse into one update with the latest local state. |
| **Soft Deletes** | Records use `deletedAt`. All entities require `createdAt` and `updatedAt`. |

## Enumerations

### TaskStatus (Integer)

| Value | Name | Color |
|-------|------|-------|
| 0 | TODO | Grey |
| 1 | NEXT | Purple |
| 2 | IN_PROGRESS | Blue |
| 3 | DONE | Green |
| 4 | ARCHIVED | Green |

## Schemas

### Goal
`id, userId, name, emoji, quarter` (e.g. `"26 Q3"`), `description` (Markdown), `version, createdAt, updatedAt, deletedAt`

Index: `userId`

### Task
`id, userId, sprint, goalId, name, emoji, status`
- `sprint` — string | null; normalized sprint key (e.g. `"26 Q2 11"` = 11th week of Q2 2026, Saturday–Friday cycle) or `null` for unassigned
- `eventDate` — ISO string | null
- `snooze` — string | null; either an ISO date string (absolute / relative-to-now) or `"-{seconds}"` (negative offset relative to `eventDate`, e.g. `"-86400"` for −1 day)
- `description` (Markdown), `sourceUrl`, `duration` (Number, in seconds)
- `version, createdAt, updatedAt, deletedAt`

Indexes: `userId, sprint, goalId, status, createdAt`

## Sprint Keys

Not stored — derived from the current date. Format: `"YY QN W"` (e.g. `"26 Q2 11"` = 11th Saturday–Friday week of Q2 2026). Week 1 of a quarter is the week starting on the first Saturday on or after the quarter's first day.

| Label | Offset from current |
|-------|---------------------|
| past | < −1 week |
| previous | −1 week |
| **current** | this week |
| next | +1 week |
| future | > +1 week |

## Business Rules

- **Rollover**: On app open, any incomplete task (`status < DONE`) whose `sprint` key is before the current sprint key is updated to the current sprint key.
- **Snooze Shifting**: When `eventDate` shifts, recalculate the display date for any `snooze` value starting with `"-"` by adding the offset to the new `eventDate`. Absolute ISO snooze values are unaffected.
- **Snooze Constraint**: Resolved snooze date must always precede `eventDate`. Validated on save and on any edit that affects either field. `@-Nd/h` tokens require `eventDate` to be present — blocked in the UI if missing.
- **Deletion Constraints**: Deleting a Goal nullifies its foreign key on linked Tasks.
