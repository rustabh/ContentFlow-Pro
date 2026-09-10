# ContentFlow Pro

Client content planning and social media production management system for
**Incinc Media** — a premium, minimal agency dashboard for planning monthly
deliverables, shoots, captions and content calendars.

## Features

- **Dashboard** — total/active clients, posts & reels remaining, upcoming shoots, this-week schedule, calendar preview and per-client progress bars
- **Client Management** — full client profiles with package details (posts / reels / stories / shoot days), platforms and notes
- **Monthly Content Planner** — one click generates a full month: deliverables distributed evenly across the month (avoiding consecutive days when possible), platform-appropriate best posting times, and placeholder topics, captions, hashtags and CTAs
- **Shoot Planner** — shoot days auto-calculated from the package, with location, products, models, equipment, shot list, reference link and completion tracking
- **Content Ideas** — industry-based idea generator (topic, hook, script, caption, CTA, hashtags)
- **Calendar View** — monthly calendar of every planned item; click any item to edit
- **Workflow** — Planned → Shoot Pending → Editing → Approval → Scheduled → Posted, plus a separate approval state; every stage editable, with a full approval history trail (reviewer, note, timestamp) per item
- **Package Logic** — changing a client's package automatically rebuilds the current month's plan (already-posted items are kept and counted)
- **Scheduling Queue** — every "Scheduled" item in one place (Overdue / Due Today / Upcoming); "Run Due Posts" publishes automatically for clients with a connected Instagram/Facebook account, or marks items Posted for manual workflows
- **Auto-Posting (Instagram/Facebook/LinkedIn/YouTube)** — optional per-client connection so the Scheduling Queue can publish for real; falls back to manual status tracking when not connected. Instagram/Facebook via the Meta Graph API, LinkedIn Company Page posts (text + hashtags) via the UGC Posts API, YouTube video uploads (needs an attached video) via the Data API v3 with OAuth refresh-token support. Due posts publish automatically every 15 minutes via a Netlify Scheduled Function — no one has to open the app for content to go out
- **Media Attachments** — attach an image or video to any content item (stored in Netlify Blobs), shown in the planner, queue, and client approval view
- **Client Approval Links** — a shareable, token-gated read-only link per client so they can approve/reject this month's plan without an internal login
- **AI-Generated Ideas** — when `ANTHROPIC_API_KEY` is set, the Content Ideas generator calls Claude for real, brand-specific captions instead of static templates (automatic fallback when no key is set)
- **Analytics** — posting consistency, 6-month trend, platform mix, and per-client performance
- **Exports** — professionally formatted Excel (.xlsx), CSV, and a printable PDF view
- **Search & Filters** — global top-bar search plus client / month / platform / status filters
- **Team Logins** — username/password accounts (Settings → Team Logins); every page and internal API route requires a session

## Tech

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- [Netlify DB](https://ntl.fyi/database-environment) (Postgres via Drizzle ORM) behind a single data-access module (`src/lib/db.ts`) — the whole app state is stored as one JSON blob in the `app_state` table, so every API route reads/writes through `readDb`/`writeDb` without needing a relational rewrite
- [Netlify Blobs](https://ntl.fyi/blobs) for content media attachments
- [Anthropic SDK](https://platform.claude.com) (optional) for AI-generated content ideas
- [exceljs](https://github.com/exceljs/exceljs) for styled Excel exports
- Username/password auth (`src/lib/auth.ts`, `src/lib/password.ts`) — scrypt-hashed passwords, DB-backed sessions via an httpOnly cookie; no third-party auth provider, no email delivery (password resets are done by another team member in Settings)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app needs a
`NETLIFY_DB_URL` connection string in the environment (Netlify injects this
automatically once **Netlify DB** is enabled for the site; for local
development run `netlify dev` or set `NETLIFY_DB_URL` to a Postgres
connection string yourself). On first run the app seeds itself with two
sample clients and a generated plan for the current month. Use **Settings →
Reset to Sample Data** to start over, or delete the sample clients to start
clean.

### Optional environment variables

- `ANTHROPIC_API_KEY` — enables real AI-generated content ideas (Content Ideas page). Without it, the built-in template generator is used.
- Per-client Instagram/Facebook **access tokens are entered in the UI** (Clients → Edit → Platform Connections), not as environment variables — they're stored per client since each client has their own social accounts.

### Logging in

No accounts are seeded — the first time anyone opens the deployed site, `/login` detects there are zero accounts and shows a one-time "create the first login" form instead of a sign-in form. Pick any username/password there (min 8 characters); that becomes the first admin login. After signing in, add teammates yourself from **Settings → Team Logins**; there's no email delivery, so share new passwords with teammates directly.

## Project Structure

```
src/
  app/
    (app)/            # pages inside the sidebar/topbar shell
      page.tsx        # Dashboard
      clients/  planner/  shoots/  ideas/  calendar/  exports/  settings/
      queue/  analytics/  # scheduling queue, analytics
    approve/[token]/   # public, token-gated client approval page (no sidebar)
    print/            # standalone printable calendar view
    api/              # REST-ish route handlers (clients, content, shoots,
                      # ideas, generate, dashboard, settings, export, queue,
                      # analytics, media, public/approve)
  components/
    layout/           # Sidebar, Topbar, global search context
    ui/               # Card, Button, Modal, Badge, ProgressBar, fields…
    clients/ planner/ # feature components
  lib/
    types.ts          # all shared types
    db.ts             # data-access module (reads/writes app_state via Drizzle)
    generator.ts      # smart scheduling, placeholder copy, idea generator
    ai.ts             # optional Claude-powered idea generation
    metaPublish.ts     # Instagram/Facebook publishing via the Meta Graph API
    linkedinPublish.ts # LinkedIn Company Page publishing via the UGC Posts API
    youtubePublish.ts  # YouTube video uploads via the Data API v3 (OAuth refresh)
    queueProcessor.ts  # shared "publish every due item" logic (used by both
                        # the manual Run Due Posts button and the scheduled
                        # auto-publish function below)
    approval.ts        # shared approval-history helper
    constants.ts      # platforms, statuses, best posting times, theme maps
    utils.ts          # date/format helpers
db/
  index.ts            # Drizzle client (Netlify DB / Postgres)
  schema.ts            # app_state table definition
netlify/database/migrations/  # SQL migrations for the app_state table
netlify/functions/
  auto-publish.ts      # Netlify Scheduled Function — runs processDueQueue()
                        # automatically every 15 minutes, so connected
                        # clients' due posts go out without anyone opening
                        # the app. Change the interval by editing the
                        # `schedule` cron expression in that file.
```

---

Designed by **Incinc Media** · [support@incincmedia.com](mailto:support@incincmedia.com)
