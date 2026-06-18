Implementation Plan: Offline-First Supabase Task Manager

Phase 1: Infrastructure & Sync POC (Proof of Concept)

Goal: Prove the custom offline queue and real-time streaming work seamlessly before building UI.

Task 1: Initialize Project Shell

Action: Bootstrap Vite + React + TypeScript app. Install tailwindcss, lucide-react, and shadcn/ui foundation.

Verification: App compiles and renders a basic "Hello World" Tailwind screen.

Task 2: Supabase Client & Auth Setup

Action: Install @supabase/supabase-js. Configure environment variables. Implement basic Email/Password or Google Auth UI (for testing).

Verification: User can log in, and a session token is received.

Task 3: Local IndexedDB Setup (Dexie.js)

Action: Install dexie. Initialize a local database schema with two tables: test_tasks and sync_queue.

Verification: Inspecting browser DevTools -> Application -> IndexedDB shows the created tables.

Task 4: POC Offline-First Write & Queue

Action: Create a dummy form to add a task. On submit: write immediately to Dexie test_tasks. If navigator.onLine is false, write the mutation payload to Dexie sync_queue.

Verification: Going offline in DevTools and submitting the form updates the UI instantly and adds a record to the sync_queue table.

Task 5: POC Network Flush Worker

Action: Add a window.addEventListener('online') listener. When triggered, read all records in sync_queue, push them to Supabase via REST, and delete them from the queue on success.

Verification: Re-enabling network in DevTools automatically clears the local queue and updates the Supabase cloud database.

Task 6: POC Real-time Streaming (Supabase to Local)

Action: Subscribe to Supabase Postgres Changes via WebSockets. When an insert/update happens on the cloud, update the local Dexie test_tasks table.

Verification: Opening the app in two separate browser windows and editing a task in Window A instantly updates Window B.

Phase 2: Core Data & State Foundation

Goal: Evolve the POC into the real schema mapped in DATA_MODEL.md.

Task 7: Define Production Schemas

Action: Apply exact schemas from DATA_MODEL.md to both Supabase (with RLS policies) and local Dexie tables (tasks, goals, sprints, sync_queue).

Verification: Cloud and local databases structurally match the documentation.

Task 8: App Routing & Auth Guard

Action: Setup react-router-dom. Create a Protected Route wrapper. Redirect unauthenticated users to a Login view.

Verification: Visiting / without a session redirects to /login.

Task 9: Zustand Local State Integration

Action: Setup Zustand stores. Create a hook that subscribes to Dexie changes (using dexie-react-hooks) and populates the Zustand store to drive the UI.

Verification: Manually adding a row in IndexedDB instantly updates the Zustand state logged to the console.

Phase 3: The Engine (Logic & Parsing)

Goal: Implement the core business logic devoid of UI.

Task 10: Dynamic Sprint Engine

Action: Write a utility service that calculates SprintState (Previous, Current, Next) based on Date.now() vs Sprint boundaries. Implement the Friday midnight rollover logic.

Verification: Unit tests confirm date inputs correctly identify "Current" vs "Next" sprints.

Task 11: Natural Language Input Parser

Action: Build the regex/parsing engine to extract eventDate, status, and snoozeDate (@-1d) from a raw string, matching USER_EXPERIENCE.md rules.

Verification: Console tests prove "Vet 1st June 12:00 progres @-1d" outputs the correct JSON metadata object.

Phase 4: Application UI

Goal: Build the interfaces as described in the vision.

Task 12: Main Layout Shell

Action: Build the persistent sidebar navigation (Current, Next, Planning, All Tasks, Goals).

Verification: User can click between empty route views.

Task 13: The Task Data Table

Action: Build the reusable Task list component. Implement status color coding. Hide markdown descriptions behind a muted icon indicator.

Verification: Mock data renders cleanly following UI rules.

Task 14: Rapid Entry & Live Parser Integration

Action: Implement the bottom-row input field. Hook up the Natural Language Parser to provide live color-coding of text as the user types.

Verification: Hitting Enter saves the task to Dexie instantly and creates a new empty row.

Task 15: Auto-Persist Inline Editing

Action: Make task table cells (Title, Status, Dates) clickable for instant inline editing. Changes auto-save on blur via Zustand/Dexie.

Verification: Clicking a title turns it into an input; clicking away saves the change. No "Save" buttons exist.

Task 16: Keyboard Shortcuts & Mass Actions

Action: Implement multi-select row checkboxes. Add event listeners for Cmd+D (Duplicate), Backspace (Delete), and 1-4 (Status changes).

Verification: Selecting three rows and pressing Backspace instantly soft-deletes them locally.

Task 17: Snooze Visibility Toggle

Action: Add the global "Show Snoozed" toggle. Apply opacity/ghosting styles to snoozed tasks when visible.

Verification: Toggling the switch accurately hides/shows tasks where snoozeDate is strictly in the future.

Phase 5: Additional Views & PWA

Goal: Complete the remaining views and make it installable.

Task 18: All Tasks & Cleanup View

Action: Implement the "All Tasks" route with Cursor Pagination. Add filters for "Completed" and sorting by createdAt.

Verification: User can view past completed tasks and mass-delete them.

Task 19: Goals Management View

Action: Implement the Goals table with inline editing. Add aggregate counts (Tasks completed vs total).

Verification: Modifying a goal name instantly persists; deleting a goal unlinks its tasks without deleting the tasks.

Task 20: PWA Transformation

Action: Install vite-plugin-pwa. Configure the web manifest (icons, standalone display) and setup standard asset caching.

Verification: Lighthouse PWA audit passes, and the app prompts "Add to Home Screen" on iOS Safari.