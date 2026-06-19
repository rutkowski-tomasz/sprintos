# 🏃 SprintOS

Personal offline-first weekly sprint manager — task inbox-zero via automated Friday rollovers, installable as a PWA.

## 💡 Intent

- Offline-first: all reads/writes hit local IndexedDB instantly; a custom sync queue pushes to the cloud and survives force-close
- Real-time: changes in one window appear in another instantly via Supabase Postgres Changes
- UX is a first-class concern — keyboard shortcuts, spring-physics animations, mobile swipe gestures, and native-feel CSS (no rubber-band scroll, no tap flash) are specced before any component is built
- Ships to iOS without the App Store: installed as a PWA via Safari Add to Home Screen — a workaround, not a native app, but good enough for personal use
- Docs-first: product vision, data model, and full UX rules were written and iterated on extensively before the first line of code — the goal is to spend more time imagining and modeling than implementing
- Maximum product, minimum infrastructure — Supabase handles auth, database, and real-time; almost no backend code written by hand
- AI-assisted development throughout

## 🧱 Stack

| Layer | Choice |
|-------|--------|
| Frontend | React + Vite + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Motion + AutoAnimate |
| Local DB | Dexie.js (IndexedDB) |
| Sync | Custom offline queue → Supabase real-time |
| Backend | Supabase (PostgreSQL + Auth + Realtime) |
| Distribution | PWA via `vite-plugin-pwa` |

## 🚀 First Setup

**1. Google OAuth** — console.cloud.google.com:
- APIs & Services → OAuth consent screen — configure this first (required before creating a client)
- Credentials → Create OAuth 2.0 Client ID (Web application)
- Authorized JavaScript origins: `http://localhost:5173`
- Authorized redirect URIs: `https://<project>.supabase.co/auth/v1/callback`

**2. Supabase project** — create one at supabase.com, then:
- Authentication → Providers → Google → enable, paste Client ID + Secret from step 1
- Authentication → URL Configuration → Site URL + Redirect URL: `http://localhost:5173`

**2a. Database schema** — Supabase → SQL Editor → run these files in order:
1. `supabase/migrations/001_production_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`

**3. Secrets**

```bash
cp .env.example .env
# fill in VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from Supabase → Settings → API
```

**4. GitHub secrets** — repo Settings → Secrets and variables → Actions → add:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**5. GitHub Pages** — repo Settings → Pages → Source: set to **GitHub Actions**

**6. Run**

```bash
pnpm install
pnpm dev
```

## 📚 Docs

| File | Contents |
|------|----------|
| `docs/product.md` | Vision, stack, views, UX rules |
| `docs/data_model.md` | Schemas, sync strategy, business rules |
| `docs/roadmap.md` | 26-task implementation plan |
