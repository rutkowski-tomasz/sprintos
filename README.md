# SprintOS

Personal offline-first weekly sprint manager — task inbox-zero via automated Friday rollovers, installable as a PWA.

## Intent

A learning project exploring: AI-assisted development, docs-first planning, PWA as a native iOS app (no App Store), offline-first architecture, real-time streaming, and backend-as-a-service — with as little hand-written infrastructure as possible. Polished, native-feeling UX is a first-class goal.

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion + AutoAnimate |
| Local DB | Dexie.js (IndexedDB) |
| Sync | Custom offline queue → Supabase real-time |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Distribution | PWA via `vite-plugin-pwa` |

## Run

```bash
# coming soon
```

## Docs

| File | Contents |
|------|----------|
| `product.md` | Vision, stack, views, UX rules |
| `data_model.md` | Schemas, sync strategy, business rules |
| `roadmap.md` | 26-task implementation plan |
