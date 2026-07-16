# Incinc CRM

A single-file CRM + finance manager built for **Incinc Media** — a digital agency in Mumbai. Everything (money, clients, leads, team, invoices) lives in one fast, installable web app. No backend, no login, no build step: data is saved locally in the browser, with JSON backup/restore to move between devices.

**Live app:** open `index.html` in any browser, or host it (see [Deploy](#deploy)).

---

## Features

### 📊 Dashboard
- Greeting header with live snapshot: total across accounts + this-month profit
- Stat cards: today's income/expense, monthly profit, pending receivables, payroll, recurring burn, working clients, open leads
- Income vs expense chart (last 6 months), expense-by-category donut, balance-by-account bars
- **"Needs attention" panel** — overdue installments, recurring bills due, unpaid salaries and lead follow-ups, sorted by urgency

### 💰 Multi-account Ledger
- Income / Expense / Internal transfer entries across accounts (Current, Savings, Cash — customisable)
- Business + Personal expense categories (rent, ads, salary, food, petrol…)
- Income linked to client, service, invoice no., GST flag and pending amount
- Live balance band across all accounts on every screen
- 🆕 **Search + filters** — instant search on client/category/note/amount, plus Income/Expense/Transfer tabs

### 👥 Clients
- Full profiles: company, phone, email, GSTIN, PAN, industry, notes
- Status tabs: Working / Non-working / Completed / Lost
- Services per client (SMM, website, ads, shoots…) with retainer or installment payment plans
- SMM plan details (platforms, posts/reels/stories per month)
- Installment tracker — mark paid ⇒ auto-creates the income entry in the ledger
- WhatsApp payment reminder with pending amount and UPI/bank details pre-filled

### 🎯 Leads
- Pipeline: New → Contacted → Follow-up → Qualified → Won / Lost
- Source tracking (Reference, Ads, Direct, Social…) + expected value
- Follow-up log per lead: date, note, response, next follow-up date (surfaces on the dashboard)
- One-click **Convert to client**
- WhatsApp follow-up message pre-filled

### 🧑‍💼 Team, Attendance & Payroll
- Members with department, salary, joining date
- Monthly attendance grid: Present / Late / Half-day / Absent / Week-off, quick-mark for today
- Auto payroll: per-day salary, half-day = 0.5 deduction, **4 lates = 1 day cut**
- Pay salary ⇒ auto expense entry in the ledger, tracked per month

### 🔁 Recurring
- Rent, subscriptions (Adobe, Canva, hosting…), internet — with due day of month
- Status per month: Paid / Due today / Upcoming / Overdue
- "Log payment" ⇒ auto ledger expense + marks the month paid

### 🧾 GST Invoices
- Proper Indian tax invoice: multi-line items with HSN/SAC, CGST+SGST (intra-state) or IGST (inter-state), amount in words
- Auto invoice numbering per financial year (`IM/2026-27/G/001`)
- Print / save as PDF, mark paid ⇒ auto income entry, WhatsApp the invoice summary
- 🆕 **Duplicate invoice** — one click to raise the same invoice for the next month

### 📈 Reports
- Lifetime revenue / expense / profit, 6-month P&L table
- Expense by category, revenue by client, revenue by service
- GST collected vs pending summary
- Leads by source + conversion view
- Print / PDF export

### ⚙️ Settings, Data & Backup
- Business profile (name, address, GSTIN, PAN) — printed on every invoice
- Bank + UPI details — added to invoices and WhatsApp reminders
- **Backup (JSON) / Restore** — move all data to another device
- CSV exports: 🆕 Ledger, Clients and Leads
- Reset to sample data

### 🌐 App-wide
- 🆕 **Global search (`Ctrl/⌘ + K`)** — find any client, lead, invoice, team member or transaction from anywhere
- 🆕 **Offline PWA** — service worker caches the app; installs to the home screen and works without internet once hosted
- Mobile-first responsive layout with bottom tab bar
- Dark premium UI, Indian number formatting (₹, lakh/crore), `en-IN` dates

---

## What's new in this release (add-ons)

| Add-on | Where |
|---|---|
| Global search with keyboard shortcut (Ctrl/⌘+K) | Topbar 🔍 button, everywhere |
| Ledger live search + type filter tabs | Ledger |
| Duplicate invoice (next-period billing in one click) | Invoices |
| Clients CSV + Leads CSV export | Reports & Settings |
| Offline support via service worker (installable PWA) | Automatic when hosted |

## Roadmap ideas (not yet built)

- Quotation/proposal builder (like invoices, convertible to invoice on approval)
- Lead pipeline Kanban drag-and-drop view
- Receipt/photo attachments on expenses
- Multi-user sync via a small backend (Supabase/Firebase)
- PIN lock for the app
- E-invoice / GSTR-1 JSON export

---

## Run locally

No build needed:

```bash
# option 1: just open it
open index.html

# option 2: serve it (enables the service worker / PWA install)
python3 -m http.server 8080
# → http://localhost:8080
```

## Deploy

**GitHub Pages** (recommended, free):
1. Repo → **Settings → Pages**
2. Source: *Deploy from a branch* → pick the branch → `/ (root)` → Save
3. App is live at `https://<user>.github.io/<repo>/` — installable as a PWA on phone/desktop

Any static host works too (Netlify, Vercel, Hostinger — just upload `index.html` + `sw.js`).

> **Note:** data is stored in the browser (`localStorage`). Take a JSON backup from **Settings → Backup** before clearing the browser or switching devices.
