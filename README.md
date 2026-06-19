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

## First Setup

**1. Google OAuth** — console.cloud.google.com:
- APIs & Services → OAuth consent screen — configure this first (required before creating a client)
- Credentials → Create OAuth 2.0 Client ID (Web application)
- Authorized JavaScript origins: `http://localhost:5173`
- Authorized redirect URIs: `https://<project>.supabase.co/auth/v1/callback`

**2. Supabase project** — create one at supabase.com, then:
- Authentication → Providers → Google → enable, paste Client ID + Secret from step 1
- Authentication → URL Configuration → Site URL + Redirect URL: `http://localhost:5173`

**3. Secrets**

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase → Settings → API
```

**4. Run**

```bash
pnpm install
pnpm dev
```

## Docs

| File | Contents |
|------|----------|
| `docs/product.md` | Vision, stack, views, UX rules |
| `docs/data_model.md` | Schemas, sync strategy, business rules |
| `docs/roadmap.md` | 26-task implementation plan |
