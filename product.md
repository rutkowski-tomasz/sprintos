Product Vision: Personal Offline-First Sprint Manager

1. Core Purpose & Philosophy

This application is a strictly personal, single-user productivity tool designed to remove friction from a specific task-management workflow. It is not intended for public release or monetization. The overarching philosophy is "Inbox Zero for Tasks," leveraging automated weekly sprint cycles to force prioritization and keep the active workspace clean.

2. Platform & Architecture Strategy

Platform: React (e.g., Vite + React) configured as a Progressive Web App (PWA). Because App Store distribution is intentionally avoided, a standard React PWA is the optimal choice. It provides a lightweight, fast codebase that can be natively installed to an iOS Home Screen via Safari.

Offline-First Data Layer: Powered by Supabase + PowerSync. This provides a robust PostgreSQL cloud database synced to a local SQLite database running directly in the browser via WASM.

Sync Behavior: Read, write, update, and delete actions execute instantly against the local SQLite database. Background synchronization (via PowerSync) pushes changes to the cloud when a connection is available. If the app is force-closed while offline, pending mutations are safely stored in local SQLite and synced upon the next launch.

3. The Automated Sprint Cycle

The core engine of the app is an automated, rolling weekly sprint.

Rollover Trigger: Friday midnight.

Rollover Action: All incomplete tasks in the Current sprint are automatically moved to the Next sprint. A new sprint is generated.

Sprint Taxonomy (Dynamically Calculated): * Past (Historical, archived sprints)

Previous (The most recently finished sprint)

Current (The active working view)

Next (Planned for the upcoming week)

Future (Backlog/horizon)

4. Core Entities

Tasks: The fundamental unit of work. Contains all associated data:

Primary: Emoji icon, Title, Status (To-Do, Next, In Progress, Done, Archive), Assigned Sprint, Goal Link. (Note: Done and Archive are both considered "Completed").

Time Management: Event Date (hard deadline/appointment) and Snooze Date (visibility toggle).

Context: Markdown description (free text) and Source URL/Duration (for media/links).

Goals: Quarterly objectives containing:

Title and Emoji icon.

Quarter format (e.g., "26 Q3").

Markdown summary.

Linked tasks to track overall progress.

5. View Hierarchy

Current Sprint (Default): Incomplete tasks for the active week, grouped/ordered by status (In Progress -> To-Do).

Next Sprint: Planning view showing only tasks slated for the upcoming week.

Planning: A holistic view of all incomplete tasks across all sprints, ordered by Sprint, then Status.

All Tasks: Comprehensive table allowing filtering by Goal, Status (including viewing all "Completed"), full-text search, and sorting by creation date to facilitate mass deletion of old tasks.

Goals Management: A table view listing all Goals. Displays aggregated progress metrics (Total Tasks vs. Completed Tasks). Allows inline creation, renaming, and mass-deletion via multi-select.

Sprints Management: A read-only table view of historical and future Sprints. Allows deletion of past or distant-future sprints to clear database clutter.

6. Architecture & Tech Stack Decisions

Chosen Stack: React PWA + Supabase (PostgreSQL) + PowerSync.

Reasoning: Provides a clean, relational data structure, guarantees persistent offline capability via an embedded SQLite database, and uniquely supports lightning-fast, 100% offline full-text search and complex multi-field filtering out of the box.

Rejected Options:

Firebase / Firestore: Rejected because it lacks native offline full-text search and requires tedious, manual composite indexes for the complex multi-field filtering required by the views.

Convex: Rejected because its client stores mutations in-memory, meaning offline data is permanently lost if the iOS browser app is force-closed before regaining an internet connection.

Custom .NET Backend + Next.js: Rejected because writing a custom SQLite sync engine, WebSocket server, and conflict-resolution logic from scratch severely violates the strict 1-week timeline constraint.


---

User Experience & Interaction Rules

1. UI Principles

Visual Clarity: Table views hide heavy text behind a muted, expandable icon.

Auto-Persist & Inline Editing: No "Save" or "Cancel" buttons. Clicking a field enters edit mode; changes save automatically on blur/state change.

Sync Indicator: A non-blocking, subtle UI element (e.g., an icon in the header) must indicate when the app is actively syncing with the cloud.

Discoverable Shortcuts: Shortcuts are explicitly visible in the UI.

2. Rapid Task Entry & Autocompletion

Desktop: Clicking "New Task" opens a bottom row. AI suggests completions. Press Tab to accept. Press Enter to save and open a new blank row.

Mobile: An accessory toolbar handles acceptance. Tapping "Return" saves and keeps the input active.

3. Natural Language Input Parsing

Text input intelligently extracts metadata from the string in real-time.

Live Color-Coding: Parsed entities highlight instantly. (e.g., "Vet 1st June 12:00 progres @-1d").

Post-Parse Editing: Once the string is confirmed, the natural language text is stripped. The title becomes just "Vet". If the user clicks the title to edit it, they only edit the word "Vet". They do not see the raw string again. To edit the date or status, they must interact with the respective columns.

Snooze Parsing: Triggered by @ (e.g., "@-1d"). Snooze Date cannot be set after the Event Date.

4. Time Management & View Toggles

Snooze Visibility Toggle: A global toggle to "Show Snoozed Tasks". Snoozed tasks appear ghosted/opacity reduced.

Snoozed Task Interaction: Users can fully interact with snoozed tasks while they are visible (e.g., swiping a ghosted task to mark it DONE immediately) without needing to un-snooze it first.

5. View Modifiers (All Tasks)

The "All Tasks" view utilizes cursor pagination to ensure UI performance is unaffected by years of historical task data. It allows filtering by "Completed" status and sorting by createdAt for mass cleanup.

6. Keyboard Shortcuts & Mass Actions (Desktop)

Multi-Select: Shift-click or command-click multiple rows.

Duplication: Cmd+D / Ctrl+D instantly duplicates.

Deletion: Backspace instantly deletes selected rows.

Status Updates: Dedicated keybindings (e.g., numbers 1-4).

7. Mobile Gestures

Swipe Right: Quick-action to mark a task as DONE.

Swipe Left: Opens a quick-snooze menu.