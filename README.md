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
- **Workflow** — Planned → Shoot Pending → Editing → Approval → Scheduled → Posted, plus a separate approval state; every stage editable
- **Package Logic** — changing a client's package automatically rebuilds the current month's plan (already-posted items are kept and counted)
- **Exports** — professionally formatted Excel (.xlsx), CSV, and a printable PDF view
- **Search & Filters** — global top-bar search plus client / month / platform / status filters

## Tech

- [Next.js](https://nextjs.org) (App Router) + TypeScript
- Tailwind CSS v4
- Local JSON store (`data/db.json`) behind a single data-access module (`src/lib/db.ts`) — swap in a real database later without touching the API routes
- [exceljs](https://github.com/exceljs/exceljs) for styled Excel exports
- No authentication (single-agency internal tool)

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). On first run the app
seeds itself with two sample clients and a generated plan for the current
month. Use **Settings → Reset to Sample Data** to start over, or delete the
sample clients to start clean.

## Project Structure

```
src/
  app/
    (app)/            # pages inside the sidebar/topbar shell
      page.tsx        # Dashboard
      clients/  planner/  shoots/  ideas/  calendar/  exports/  settings/
    print/            # standalone printable calendar view
    api/              # REST-ish route handlers (clients, content, shoots,
                      # ideas, generate, dashboard, settings, export)
  components/
    layout/           # Sidebar, Topbar, global search context
    ui/               # Card, Button, Modal, Badge, ProgressBar, fields…
    clients/ planner/ # feature components
  lib/
    types.ts          # all shared types
    db.ts             # JSON-file data store (swap point for a real DB)
    generator.ts      # smart scheduling, placeholder copy, idea generator
    constants.ts      # platforms, statuses, best posting times, theme maps
    utils.ts          # date/format helpers
data/db.json          # local data (auto-created & seeded, gitignored)
```

---

Designed by **Incinc Media** · [support@incincmedia.com](mailto:support@incincmedia.com)
