# Odoo Hackathon — Fleet Management System

A **Next.js 15** fleet management application for the Odoo Hackathon. Manages vehicles, drivers, trips, maintenance, fuel logs, and expenses with a dark-mode dashboard built on **shadcn/ui**, **Tailwind CSS v4**, **Prisma + PostgreSQL**, and **Next.js 15 App Router**.

---

## 🏗 Project Structure

```
odoo-hackathon/
├── .claude/                    # Opencode/Claude configuration & skills
├── .next/                      # Next.js build output (gitignored)
├── .env                        # Environment variables (gitignored)
├── prisma/
│   └── schema.prisma           # Prisma schema (PostgreSQL)
├── public/                     # Static assets (favicon, etc.)
├── scripts/
│   └── seed.ts                 # Seed script (bun run seed)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (app)/              # Route group: authenticated dashboard
│   │   │   ├── dashboard/      # Dashboard page
│   │   │   ├── vehicles/       # Vehicle management
│   │   │   ├── drivers/        # Driver management
│   │   │   ├── trips/          # Trip management
│   │   │   ├── maintenance/    # Maintenance logs
│   │   │   ├── fuel/           # Fuel logs
│   │   │   ├── expenses/       # Expense tracking
│   │   │   └── layout.tsx      # Dashboard layout with sidebar
│   │   ├── api/                # API routes (Next.js route handlers)
│   │   │   ├── auth/           # Auth endpoints (login, logout, me)
│   │   │   ├── vehicles/       # Vehicle CRUD
│   │   │   ├── drivers/        # Driver CRUD
│   │   │   ├── trips/          # Trip CRUD + dispatch
│   │   │   ├── maintenance/    # Maintenance logs
│   │   │   ├── fuel/           # Fuel logs
│   │   │   └── expenses/       # Expense CRUD
│   │   ├── login/              # Login page
│   │   ├── globals.css         # Global styles + Tailwind v4
│   │   ├── layout.tsx          # Root layout
│   │   └── page.tsx            # Landing page (redirects to login/dashboard)
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components (Button, Card, Dialog, etc.)
│   │   └── app/                # App-specific composite components
│   │       ├── sidebar.tsx     # Sidebar navigation
│   │       ├── header.tsx      # Top header with user menu
│   │       ├── data-table.tsx  # Reusable data table component
│   │       ├── status-badge.tsx# Status badge component
│   │       └── ...             # Other shared components
│   ├── lib/                    # Core libraries & utilities
│   │   ├── auth.ts             # Auth utilities (JWT, bcrypt, session)
│   │   ├── db.ts               # Prisma client singleton
│   │   ├── auth.ts             # Auth helpers
│   │   ├── dashboard.ts        # Dashboard stats queries
│   │   ├── dispatch-pool.ts    # Trip dispatch pool logic
│   │   ├── fleet-snapshot.ts   # Fleet snapshot queries
│   │   ├── reports.ts          # Reports/analytics queries
│   │   ├── status.ts           # Status constants & helpers
│   │   ├── nav.ts              # Navigation config
│   │   ├── utils.ts            # Utility functions (cn, etc.)
│   │   └── dispatch-pool.ts    # Dispatch pool logic
│   └── proxy.ts                # Next.js rewrite proxy config
├── .env                        # Environment variables (NOT committed)
├── .env.example                # Example env file (template)
├── .gitignore
├── AGENTS.md                   # Agent instructions for AI assistants
├── AGENTS.md
├── build-plan.md               # Build plan / task breakdown
├── components.json             # shadcn/ui config
├── context.md                  # Project context for AI
├── eslint.config.mjs
├── next.config.ts
├── next-env.d.ts
├── package.json
├── postcss.config.mjs
├── prisma.config.ts
├── tsconfig.json
└── README.md                   # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Bun** (recommended) or Node.js 20+
- **PostgreSQL** (local or hosted — Neon, Supabase, Railway, etc.)

### Installation

```bash
# Clone & install
git clone <repo-url>
cd odoo-hackathon
bun install

# Set up environment
cp .env.example .env
# Edit .env with your DATABASE_URL and AUTH_SECRET

# Set up database
bunx prisma migrate dev --name init
bun run seed

# Start development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) → redirects to `/login`.

---

## 🔐 Authentication

- **JWT-based** (jose) with HttpOnly cookies
- **bcryptjs** for password hashing
- **Seeded users** (run `bun run seed`):
  | Email | Password | Role |
  |-------|----------|------|
  | admin@fleet.com | admin123 | Admin |
  | manager@fleet.com | manager123 | Manager |
  | dispatcher@fleet.com | dispatch123 | Dispatcher |
  | viewer@fleet.com | viewer123 | Viewer |

> **No signup flow** — hackathon seed data only.

---

## 🗄 Database Schema (Prisma)

Key models in `prisma/schema.prisma`:

| Model | Purpose |
|-------|---------|
| `User` | Auth users with roles |
| `Vehicle` | Fleet vehicles (type, status, capacity) |
| `Driver` | Drivers (license, status, expiry) |
| `Trip` | Trips (vehicle, driver, status, revenue) |
| `MaintenanceLog` | Vehicle maintenance records |
| `FuelLog` | Fuel purchases per vehicle |
| `Expense` | Trip/vehicle expenses |
| `Revenue` | Revenue entries for completed trips |

Run migrations:
```bash
bunx prisma migrate dev --name <name>
bunx prisma generate
```

Open Prisma Studio:
```bash
bunx prisma studio
```

---

## 🎨 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 (App Router, React 19) |
| Styling | Tailwind CSS v4, shadcn/ui (Radix UI) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (jose) + bcryptjs, HttpOnly cookies |
| Charts | Recharts |
| Validation | Zod v4 |
| AI | OpenAI SDK (for future AI features) |
| Runtime | Bun (or Node 20+) |

---

## 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start dev server (Turbopack) |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run seed` | Seed database with demo data |
| `bunx prisma migrate dev` | Create & run migration |
| `bunx prisma generate` | Generate Prisma Client |
| `bunx prisma studio` | Open Prisma Studio |

---

## 🌐 Environment Variables

Create `.env` from `.env.example`:

```env
# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname?schema=public"

# Auth
AUTH_SECRET="your-super-secret-jwt-key-min-32-chars"
AUTH_COOKIE_NAME="fleet-auth"

# Optional: OpenAI (for future AI features)
OPENAI_API_KEY="sk-..."
```

---

## 🧭 App Routes (App Router)

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing → redirects to login/dashboard | Public |
| `/login` | Login page | Public |
| `/dashboard` | Overview KPIs, fleet snapshot | Authenticated |
| `/vehicles` | Vehicle CRUD, status badges | Authenticated |
| `/drivers` | Driver CRUD, license status | Authenticated |
| `/trips` | Trip list, dispatch, status workflow | Authenticated |
| `/maintenance` | Maintenance logs | Authenticated |
| `/fuel` | Fuel logs | Authenticated |
| `/expenses` | Expense tracking | Authenticated |

> All `/dashboard/*` routes are wrapped in `(app)` route group with shared layout (sidebar + header).

---

## 🧩 Component Architecture

### UI Components (`src/components/ui/`)
shadcn/ui components — **don't modify directly**. Use `bunx shadcn@latest add <component>` to add new ones.

### App Components (`src/components/app/`)
Composite components specific to this app:
- `Sidebar` — Navigation with role-based visibility
- `Header` — User menu, theme toggle, notifications
- `DataTable` — TanStack Table wrapper with sorting, filtering, pagination
- `StatusBadge` — Consistent status rendering (colored dot + label)
- `KPICard` — Dashboard metric cards
- `VehicleCard`, `DriverCard`, `TripCard` — Entity display cards

### Adding a New Page
1. Create route in `src/app/(app)/<feature>/page.tsx`
2. Create API routes in `src/app/api/<feature>/route.ts` (GET, POST, PATCH, DELETE)
3. Add Zod schemas in `src/lib/<feature>.ts` for validation
4. Add navigation entry in `src/lib/nav.ts`
5. Create composite components in `src/components/app/` as needed

---

## 🔐 Auth Helpers (`src/lib/auth.ts`)

```typescript
// Server-side: get current user from cookie
import { getSession } from '@/lib/auth';
const user = await getSession();

// Client-side: useSession hook (React context)
import { useSession } from '@/components/providers/auth-provider';
const { user, loading } = useSession();
```

---

## 🛠 Development Workflow

### 1. Feature Branch
```bash
git checkout -b feat/vehicle-management
```

### 2. Database Changes
```bash
# Edit prisma/schema.prisma
bunx prisma migrate dev --name add-vehicle-field
```

### 3. API Layer
- Create route handlers in `src/app/api/<feature>/route.ts`
- Use Zod for request validation
- Return consistent `{ success: boolean, data?, error? }` responses

### 4. UI Layer
- Use `DataTable` for lists
- Use `Dialog` + `Form` for create/edit
- Use `StatusBadge` for all status fields
- Follow shadcn/ui patterns

### 5. Lint & Build
```bash
bun run lint
bun run build
```

---

## 🎯 Hackathon Demo Script (Seeded Data)

The seed script (`scripts/seed.ts`) creates:
- **4 users** (admin, manager, dispatcher, viewer)
- **8 vehicles** (mixed types: van, truck, etc.; statuses: active, in_shop, retired)
- **6 drivers** (1 expired license, 1 suspended, 1 expiring in 20 days)
- **5 trips** (various statuses: pending, in_progress, completed)
- **3 maintenance logs**, **~12 fuel logs**, **~8 expenses**
- **Revenue** on completed trips (ROI > 0)

**Demo vehicle + driver for judge workflow:**
- Vehicle: `Van-05` (500 kg capacity)
- Driver: `Alex` (valid license)

Run the full dispatch workflow live during demo.

---

## 📦 Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables:
   - `DATABASE_URL` (Pooled connection string for serverless)
   - `AUTH_SECRET`
   - `AUTH_COOKIE_NAME`
4. Deploy — `prisma generate` runs on `postinstall`

> **Note:** Use a pooled connection string (PgBouncer) for serverless. Prisma + Next.js 15 works with `@prisma/adapter-pg`.

---

## 🏛 Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (Browser)                                │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │  React 19 RSC   │  │  Client Comp.   │  │  shadcn/ui + Tailwind v4    │  │
│  │  (Server Comp.) │  │  ('use client') │  │  (Radix UI primitives)      │  │
│  └────────┬────────┘  └────────┬────────┘  └─────────────────────────────┘  │
│           │                    │                                             │
│           ▼                    ▼                                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Next.js 15 App Router                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │  Layouts    │  │  Pages      │  │  API Routes │  │  Middleware     │ │ │
│  │  │  (Route     │  │  (RSC)      │  │  (Route     │  │  (Auth guard,   │ │ │
│  │  │   Groups)   │  │             │  │   Handlers) │  │   Theme)        │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └────────────────────────────────────┬────────────────────────────────────┘ │
└───────────────────────────────────────│──────────────────────────────────────┘
                                        │ HTTP / Server Actions
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SERVER (Node.js / Bun)                            │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                         Prisma ORM Layer                                 │ │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │ │
│  │  │  User       │  │  Vehicle    │  │  Trip       │  │  MaintenanceLog │ │ │
│  │  │  Driver     │  │  FuelLog    │  │  Expense    │  │  Revenue        │ │ │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────┘ │ │
│  └────────────────────────────────────┬────────────────────────────────────┘ │
│                                       │ Prisma Client                        │
│                                       ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    PostgreSQL (Neon / Supabase / Local)                 │ │
│  │                    (Pooled via PgBouncer for serverless)                │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Patterns

| Operation | Pattern | Example |
|-----------|---------|---------|
| **Reads (Lists/Details)** | Server Components → Prisma → DB | `page.tsx` → `getVehicles()` → `VehicleList` |
| **Mutations** | Server Actions → Prisma → DB → `revalidatePath` | `dispatchTrip()` → `prisma.$transaction` → toast |
| **Auth Checks** | Middleware + Server Action guards | `middleware.ts` + `requireRole()` in actions |
| **Real-time feel** | Optimistic UI + Server Actions + `revalidatePath` | Status badge updates after dispatch |

### Key Architectural Decisions

1. **Server Components by Default** — All pages are RSC; client components only for interactivity (dialogs, toasts, theme toggle)
2. **Server Actions for Mutations** — No separate API routes for CRUD; `use server` actions co-located with components
3. **Route Groups for Auth** — `(app)` group wraps all protected routes with shared layout + middleware guard
4. **Zod + Server Actions** — Validation at the action boundary; errors returned as typed objects, surfaced via `sonner` toasts
5. **Prisma Singleton** — `src/lib/db.ts` exports a single `prisma` instance (prevents connection exhaustion in serverless)
6. **Pooled Postgres Connection** — `DATABASE_URL` uses PgBouncer (Neon pooled) for serverless compatibility
7. **Dark Mode Only** — `dark` class on `<html>`; no light mode toggle (hackathon time-saver + bonus feature claim)

### Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    DEFENSE IN DEPTH                              │
├─────────────────────────────────────────────────────────────────┤
│  1. Middleware (Edge)      →  JWT verification, redirect login  │
│  2. Server Actions         →  requireRole(['admin', 'manager']) │
│  3. UI Layer               →  Hide nav/actions by role          │
│  4. Database               →  RLS not used (single tenant)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🤝 Team Conventions

| Aspect | Convention |
|--------|------------|
| **Code style** | TypeScript strict, ESLint (Next.js config), Prettier via editor |
| **Components** | shadcn/ui patterns, `class-variance-authority` for variants |
| **State** | Server components by default; client components only when needed (`'use client'`) |
| **Data fetching** | Server actions for mutations, RSC for reads |
| **Validation** | Zod schemas in `src/lib/<feature>.ts` |
| **Errors** | Toast notifications via `sonner` |
| **Dark mode** | Only dark mode (Tailwind `dark` class on `<html>`) — counts as bonus feature |

---

## 📚 Useful Commands

```bash
# Regenerate Prisma client after schema changes
bunx prisma generate

# Reset database & reseed (dev only)
bunx prisma migrate reset --force && bun run seed

# Check for TypeScript errors
bunx tsc --noEmit

# View bundle analysis
ANALYZE=true bun run build
```

---

## 📝 License

MIT — Hackathon project, use freely.