Data Model & Schema Definition

1. Architecture Context: Offline-First & Auth

Authentication: A user authenticates via a standard provider. All records include userId.

Conflict Resolution (Server Wins): User-editable records include a version integer. The API acts as the source of truth. If a local sync request fails due to an optimistic locking validation error (version mismatch), the local queue immediately drops the update request and pulls the latest entity state from the server.

Offline Queue Collapsing: If a user makes multiple edits to a single entity while offline, the local sync queue must collapse these into a single update payload containing the latest local state.

Sync Strategy (Soft Deletes): Records use a deletedAt timestamp to trigger server-side deletion upon sync. Timestamps (createdAt, updatedAt) are required on all entities.

2. Enumerations & Constants

TaskStatus (Stored as Integer)

0 = TODO (Grey)

1 = NEXT (Purple)

2 = IN_PROGRESS (Blue)

3 = DONE (Green)

4 = ARCHIVED (Green)

3. Entity Schemas

Goal

id, userId, name, emoji, quarter (e.g., "26 Q3"), description (Markdown), version, createdAt, updatedAt, deletedAt.

Indexes: userId

Sprint

id, userId, name (e.g., "Q2 11"), startDate, endDate, version, createdAt, updatedAt, deletedAt.

Indexes: userId, startDate, endDate

Task

id, userId, sprintId, goalId, name (Parsed title string), emoji, status.

eventDate (String | Null) - Stored as an ISO string.

snoozeDate (String | Null) - Stored as ISO string.

description (Markdown), sourceUrl, duration (Number), version, createdAt, updatedAt, deletedAt.

Indexes: userId, sprintId, goalId, status, createdAt

4. Key Logic Rules

Relative Snooze Shifting: If a task has both an eventDate and a snoozeDate, and the user shifts the eventDate (e.g., moves it forward by 1 day), the system must automatically shift the snoozeDate by the exact same time delta to maintain the relative visibility threshold.

Deletion Constraints: Deleting Goals or Sprints sets the respective foreign keys on associated Tasks to NULL. CURRENT and NEXT sprints cannot be deleted.