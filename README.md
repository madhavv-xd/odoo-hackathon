# 🚚 TransitOps — Smart Fleet Operations Console

A full-stack fleet operations platform built for the Odoo Hackathon. TransitOps digitizes **vehicle, driver, dispatch, maintenance, and expense** management with **business rules enforced in the database**, live KPIs, and an **AI copilot grounded in real operational data**.

> **Judges' bar:** clean data model, correct business-rule automation, polished operational UI. TransitOps is built to demonstrate all three.

**Tech:** Next.js 16 (App Router) · React 19 · Bun · Prisma 7 + Neon Postgres · Tailwind v4 + shadcn/ui · Groq (Llama 3.3 70B) · Custom JWT auth · Zod

---

## ✨ Highlights

- **Enforced business rules** — capacity limits, license validity, and status transitions are validated in the UI *and* re-checked server-side inside database transactions.
- **Status-transition automation** — dispatching a trip flips the trip, vehicle, and driver in a single transaction (`Van-05 → On Trip`).
- **AI, grounded in live data** — a Fleet Copilot, an Ops Briefing, per-vehicle Health Checks, AI Insights, and Smart Dispatch — all fed a live JSON snapshot of the fleet, so they never hallucinate a vehicle.
- **Role-based access (defense in depth)** — nav hides what you can't do, and every server action re-checks your role.
- **Operational UI** — dark ops-console theme, monospace data treatment, live activity timeline, confirmation dialogs, responsive down to mobile.

📹 A full narrated demo script with exact values lives in **[`DEMO.md`](./DEMO.md)**.

---

## 🏛 Architecture

### System overview

```mermaid
flowchart TD
    subgraph Browser["🖥️ Browser"]
        RSC["React 19 Server Components"]
        CC["Client Components<br/>(dialogs, copilot, forms)"]
    end

    subgraph Next["▲ Next.js 16 (App Router) — Vercel"]
        MW["proxy.ts middleware<br/>(JWT guard on every route)"]
        Pages["Server Components<br/>(data reads)"]
        SA["Server Actions<br/>(mutations + AI calls)"]
        Route["/api/copilot<br/>(streaming route handler)"]
    end

    subgraph Data["🗄️ Data & AI"]
        Prisma["Prisma 7 + PrismaPg adapter"]
        Neon[("Neon Postgres<br/>(pooled)")]
        Groq["Groq API<br/>Llama 3.3 70B<br/>(OpenAI-compatible)"]
    end

    Browser -->|HTTP / Server Action| MW
    MW --> Pages
    MW --> SA
    MW --> Route
    Pages --> Prisma
    SA --> Prisma
    Route --> Prisma
    Prisma --> Neon
    SA -->|live fleet snapshot| Groq
    Route -->|live fleet snapshot| Groq
```

### Data model

| Model | Key fields | Relations |
|---|---|---|
| `User` | `email` (unique), name, role, passwordHash | — |
| `Vehicle` | `regNumber` (unique), type, maxLoadKg, odometerKm, acquisitionCost, status | → Trip, MaintenanceLog, FuelLog, Expense |
| `Driver` | name, licenseNumber, licenseCategory, licenseExpiry, safetyScore, status | → Trip |
| `Trip` | source, destination, cargoWeightKg, plannedDistanceKm, status, start/endOdometer, fuelConsumedL, revenue, dispatchedAt / completedAt / cancelledAt | ← Vehicle, Driver · → FuelLog |
| `MaintenanceLog` | description, cost, status, openedAt, closedAt | ← Vehicle |
| `FuelLog` | liters, cost, date | ← Vehicle, Trip? |
| `Expense` | category, amount, note, date | ← Vehicle |
| `AppSettings` | depotName, currency, distanceUnit (singleton) | — |

Money is stored as **integer rupees**, distances in **km**, weights in **kg**. Enums are native Prisma enums; full definitions live in [`prisma/schema.prisma`](./prisma/schema.prisma).

### Trip lifecycle & status automation

```mermaid
stateDiagram-v2
    [*] --> draft: Create trip
    draft --> dispatched: Dispatch<br/>(vehicle+driver → on_trip)
    draft --> cancelled: Cancel
    dispatched --> completed: Complete<br/>(vehicle+driver → available,<br/>odometer updated, fuel log created)
    dispatched --> cancelled: Cancel<br/>(vehicle+driver → available)
    completed --> [*]
    cancelled --> [*]
```

```mermaid
stateDiagram-v2
    direction LR
    available --> on_trip: trip dispatched
    on_trip --> available: trip completed / cancelled
    available --> in_shop: maintenance opened
    in_shop --> available: maintenance closed
    available --> retired: retire (irreversible)
```

Every transition surfaces a toast (e.g. `Van-05 → On Trip`) so the automation is visible.

### Authentication flow

```mermaid
sequenceDiagram
    participant U as User
    participant L as login action
    participant DB as Neon / Prisma
    participant MW as proxy middleware

    U->>L: submit email + password
    L->>DB: user.findUnique(email)
    DB-->>L: user + passwordHash
    L->>L: bcrypt.compare()
    L->>L: sign JWT (jose, HS256)
    L-->>U: Set-Cookie transitops_session (httpOnly) + redirect /dashboard
    Note over U,MW: On every subsequent request
    U->>MW: request /dashboard (cookie)
    MW->>MW: jwtVerify(cookie)
    alt valid
        MW-->>U: allow
    else invalid / missing
        MW-->>U: 307 redirect /login
    end
```

**Defense in depth:** (1) `proxy.ts` guards routes → (2) `requireRole([...])` re-checks in each server action → (3) UI hides nav items and controls the role can't use.

### AI grounding (no RAG)

```mermaid
flowchart LR
    Q["User question /<br/>AI action"] --> Snap
    subgraph Server
        Snap["Assemble live fleet snapshot<br/>(KPIs, vehicles, drivers,<br/>trips, per-vehicle costs) as JSON"]
        Prompt["System prompt +<br/>snapshot injected"]
    end
    Snap --> Prompt
    Prompt --> Groq["Groq · Llama 3.3 70B"]
    Groq --> Ans["Grounded answer<br/>cites real reg numbers"]
    Ans --> Q
```

The fleet is small (tens of rows), so the entire operational snapshot fits in a single prompt — **no embeddings, no vector DB**. This is why answers can't reference vehicles that don't exist.

---

## 🧩 Features

### Business rules (enforced server-side)

1. `regNumber` is unique (DB constraint + friendly error).
2. Dispatch pool = vehicles with `status = available` only.
3. A driver is assignable only if `available` **and** `licenseExpiry > today` (expired/suspended blocked with an explicit reason).
4. A vehicle/driver already `on_trip` can't be double-booked (re-checked inside the dispatch transaction).
5. `cargoWeightKg ≤ vehicle.maxLoadKg` (e.g. *"Cargo 550 kg exceeds Van-05 capacity 500 kg"*).
6. **Dispatch** → trip `dispatched`, vehicle + driver → `on_trip` (single transaction).
7. **Complete** → requires end odometer + fuel; trip `completed`, vehicle/driver → `available`, odometer updated, fuel log auto-created.
8. **Cancel** → releases vehicle + driver back to `available`.
9. **Open maintenance** → vehicle → `in_shop` (instantly removed from dispatch pool).
10. **Close maintenance** → vehicle → `available` (unless retired).

### AI features (Groq · Llama 3.3 70B)

| Feature | Where | What it does |
|---|---|---|
| **Fleet Copilot** | Everywhere (⌘K / topbar / floating button) | Streaming chat grounded in the live fleet snapshot |
| **AI Ops Briefing** | Dashboard | Prioritized "what needs attention" with severity levels |
| **Smart Dispatch** | Trip form | Recommends the best-fit vehicle + driver from the eligible pool, with rationale |
| **Vehicle Health Check** | Vehicle drill-down | Predictive-maintenance read from service/fuel/trip history |
| **AI Insights** | Reports | 3–5 bullet insights & anomalies over report stats |

All AI entry points degrade gracefully with a clear message if `GROQ_API_KEY` is unset.

### Roles & access

| Role | Dashboard | Vehicles | Drivers | Trips | Maintenance | Expenses | Reports | Settings |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| **Fleet Manager** | ✅ | ✅ | ✅ | ✅ create/dispatch | ✅ | ✅ | ✅ | ✅ |
| **Dispatcher** | ✅ | 👁️ | 👁️ | ✅ create/dispatch | — | — | — | — |
| **Safety Officer** | ✅ | 👁️ | ✅ | 👁️ | — | — | — | — |
| **Financial Analyst** | ✅ | 👁️ | 👁️ | 👁️ | — | ✅ | ✅ | — |

✅ full · 👁️ read-only · — hidden. Precise action gating (`requireRole`): **vehicle** & **maintenance** mutations → Fleet Manager only · **trip** create/dispatch/complete/cancel → Fleet Manager + Dispatcher · **driver** add/edit → Fleet Manager + Safety Officer, **suspend/reinstate** → Safety Officer only · **expenses/fuel** → Fleet Manager + Financial Analyst.

---

## 🚀 Quick Start

### Prerequisites
- **Bun**
- A **Neon** Postgres database (pooled connection string)
- A **Groq** API key ([console.groq.com](https://console.groq.com))

### Setup

```bash
git clone https://github.com/madhavv-xd/odoo-hackathon
cd odoo-hackathon
bun install                 # runs `prisma generate` via postinstall

cp .env.example .env        # then fill in the values (see below)

bunx prisma db push --schema=prisma/schema.prisma   # create tables (no migrations)
bun run seed                # load demo data

bun run dev                 # http://localhost:3000  → redirects to /login
```

Sign in with any demo account below (password `demo1234`).

---

## 🔐 Demo accounts

Password for all: **`demo1234`**

| Role | Email |
|---|---|
| Fleet Manager | `manager@transitops.dev` |
| Dispatcher | `dispatcher@transitops.dev` |
| Safety Officer | `safety@transitops.dev` |
| Financial Analyst | `finance@transitops.dev` |

> No signup flow — seeded users only. Auth is a custom JWT (`jose`) in an httpOnly cookie (`transitops_session`), passwords hashed with `bcryptjs`.

---

## 🌐 Environment variables

Copy `.env.example` → `.env`:

```env
# Neon Postgres — use the POOLED connection string (host contains "-pooler")
DATABASE_URL="postgresql://user:pass@ep-xxxx-pooler.region.aws.neon.tech/db?sslmode=require"

# Auth — signing secret for the JWT session cookie
JWT_SECRET="a-long-random-string"

# AI (Groq, OpenAI-compatible)
GROQ_API_KEY="gsk_..."
AI_BASE_URL="https://api.groq.com/openai/v1"
# Optional fallback: OPENROUTER_API_KEY="sk-or-..."
```

---

## 📜 Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server (Turbopack) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | ESLint |
| `bun run seed` | Wipe + reload demo data |
| `bunx prisma db push --schema=prisma/schema.prisma` | Sync schema to the DB |
| `bunx prisma generate` | Regenerate the Prisma client |
| `bunx prisma studio` | Browse the DB |

---

## 🗺 Routes

| Route | Description | Access |
|---|---|---|
| `/login` | Auth screen (live ops console) | Public |
| `/dashboard` | KPIs, AI briefing, activity timeline, attention panel | All roles |
| `/vehicles` · `/vehicles/[id]` | Registry + drill-down with AI Health Check | All (edit: FM) |
| `/drivers` | License validity, safety scores, suspend/reinstate | All |
| `/trips` | Dispatch board, create form, Smart Dispatch, lifecycle actions | All (act: FM/Dispatcher) |
| `/maintenance` | Open/close logs (auto In-Shop) | Fleet Manager |
| `/expenses` | Fuel logs + expenses, per-vehicle cost rollup | FM / Financial Analyst |
| `/reports` | Efficiency, utilization, cost, ROI, charts, AI insights, CSV export | FM / Financial Analyst |
| `/settings` | General config + RBAC matrix | Fleet Manager |
| `/search?q=` | Global search across vehicles/drivers/trips | All |

---

## 🧪 User testing flow (QA checklist)

Run this to verify a build end-to-end (for the narrated demo script, see [`DEMO.md`](./DEMO.md)).

### Testing journey

```mermaid
flowchart TD
    Start(["Open app"]) --> Login["/login — sign in<br/>as a demo role"]
    Login --> Dash["Dashboard"]

    Dash --> AI["AI checks:<br/>Generate briefing + ⌘K copilot"]
    Dash --> Veh["Vehicles<br/>add · edit · retire (confirm)"]
    Veh --> Drill["Vehicle drill-down<br/>AI Health Check"]
    Dash --> Drv["Drivers<br/>license flags · suspend/reinstate"]
    Dash --> Trip["Trips — hero flow ⬇"]
    Dash --> Maint["Maintenance<br/>open → In Shop · close"]
    Dash --> ExpRep["Expenses + Reports<br/>AI insights · CSV export"]
    Dash --> RBAC["Re-login as each role<br/>verify hidden controls"]
    RBAC --> Done(["All features verified ✅"])
```

### Hero flow — dispatch a trip

```mermaid
flowchart LR
    A["Create trip:<br/>route + cargo + distance"] --> B{"Cargo ≤ capacity<br/>& driver eligible?"}
    B -- No --> C["Red validation panel<br/>submit blocked"]
    C --> A
    B -- Yes --> D["✨ Suggest assignment<br/>AI fills vehicle + driver"]
    D --> E["Create draft trip"]
    E --> F["Dispatch"]
    F --> G["Toast: Van-05 → On Trip<br/>vehicle + driver → on_trip"]
    G --> H["Complete:<br/>odometer + fuel + revenue"]
    H --> I["Fuel log auto-created<br/>vehicle + driver → available"]
    E --> J["Cancel → confirm<br/>→ shows in activity timeline"]
```

### Step-by-step checklist

**Auth & RBAC**
1. Visit `/` → redirects to `/login`; the live dispatch feed animates.
2. Sign in as **Fleet Manager** → lands on `/dashboard`.
3. Sign in as **Financial Analyst** → confirm Maintenance/Trips-actions are hidden but Expenses/Reports work.

**Dashboard & AI**
4. **Generate briefing** → severity-tagged items citing real reg numbers.
5. Activity timeline shows real events with relative timestamps.
6. Press **⌘K** → ask *"Which vehicle costs the most to run?"* → grounded streamed answer.

**Vehicles**
7. **Add Vehicle** → save; try a duplicate reg → friendly unique error. **Edit** one.
8. Open a reg → drill-down → **Analyze** (AI Health Check).
9. **Retire** → confirmation dialog → leaves the dispatch pool.

**Drivers**
10. Check red expired-license flag + amber <30-day flag. **Suspend** (confirm dialog) → **Reinstate**.

**Trips (core)**
11. Create a trip; set cargo above capacity → **live red validation** blocks submit.
12. **✨ Suggest assignment** → auto-fills vehicle/driver + rationale.
13. **Dispatch** → toast `→ On Trip`; verify vehicle/driver flipped on their pages.
14. **Complete** (odometer + fuel + revenue) → auto fuel log. **Cancel** another → confirm dialog + shows in timeline.

**Maintenance / Expenses / Reports / Settings / Search**
15. **Open log** → vehicle → In Shop & gone from dispatch pool. **Close** → Available.
16. Add a fuel log + expense → cost rollup updates.
17. Reports charts render; **Generate AI Insights**; **Export CSV** downloads.
18. `/settings` RBAC matrix renders. Topbar search `MH` returns results.

---

## 📦 Deployment (Vercel + Neon)

1. **Initialize the DB** (once, from your machine, against the Neon URL Vercel will use):
   ```bash
   bunx prisma db push --schema=prisma/schema.prisma
   bun run seed
   ```
2. Import the repo in Vercel (framework auto-detects Next.js).
3. **Environment Variables** (Production + Preview): `DATABASE_URL` (pooled), `JWT_SECRET`, `GROQ_API_KEY`, `AI_BASE_URL`.
4. **Build Command** → `prisma generate && next build` (the generated client lives in the gitignored `src/generated/`, so generate it at build time).
5. Deploy. Set the Vercel **function region near your Neon region** to cut DB latency.

> ⚠️ Vercel's build does **not** create tables or seed — that's step 1. If login returns a `PrismaClientKnownRequestError`, the DB Vercel points at hasn't been pushed/seeded.

---

## 📁 Project structure

```
odoo-hackathon/
├── prisma/schema.prisma        # 8 models, native enums (Prisma 7, driver adapter)
├── scripts/seed.ts             # demo seed (bun run seed)
├── src/
│   ├── proxy.ts                # Next 16 middleware — JWT route guard
│   ├── app/
│   │   ├── layout.tsx          # root layout (fonts, Toaster)
│   │   ├── page.tsx            # → redirects to /dashboard
│   │   ├── not-found.tsx       # branded 404
│   │   ├── login/              # login page + live ops panel + action
│   │   ├── api/copilot/route.ts# streaming copilot endpoint
│   │   └── (app)/              # authenticated shell (sidebar + topbar + copilot)
│   │       ├── layout.tsx  error.tsx
│   │       ├── dashboard/      # KPIs, AI briefing, activity timeline
│   │       ├── vehicles/       # registry + [id] drill-down + AI health
│   │       ├── drivers/  trips/  maintenance/  expenses/
│   │       ├── reports/        # charts, AI insights, CSV export
│   │       ├── settings/  search/
│   │       └── actions.ts      # shared server actions (logout, etc.)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   └── app/                # sidebar, topbar, copilot, confirm-button, status-badge
│   ├── lib/
│   │   ├── auth.ts             # JWT sign/verify, getSession, requireRole
│   │   ├── db.ts               # Prisma singleton (PrismaPg adapter)
│   │   ├── dispatch-pool.ts    # eligible vehicles/drivers (UI + server share)
│   │   ├── fleet-snapshot.ts   # live JSON snapshot for AI grounding
│   │   ├── activity.ts         # unified activity timeline
│   │   ├── dashboard.ts  reports.ts  status.ts  nav.ts
│   └── generated/prisma/       # generated client (gitignored)
├── DEMO.md                     # narrated video/demo script
└── AGENTS.md / context.md      # build spec & AI-assistant instructions
```

---

## 🏗 Key architectural decisions

1. **Server Components by default**, client components only for interactivity (dialogs, copilot, forms).
2. **Server Actions for all mutations** (no REST CRUD routes); validated with **Zod**, errors surfaced via `sonner` toasts, `revalidatePath` after writes.
3. **Interactive transactions** (`prisma.$transaction`) for every multi-step business rule — status changes are atomic.
4. **Shared dispatch-pool logic** so the UI dropdowns and the server-side re-check can't drift apart.
5. **Custom JWT (no NextAuth)** — seeded credentials, httpOnly cookie, `proxy.ts` guard + `requireRole` in actions.
6. **AI grounded via context injection, not RAG** — a compact live snapshot in the prompt.
7. **Dark ops-console theme** with a monospace data treatment as the visual signature.

---

## 📝 License

MIT — hackathon project, use freely.
