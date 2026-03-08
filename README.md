# Health Scan Vitals (PEHD)

A full-stack healthcare platform that connects patients and providers with AI-powered insights, telehealth, clinical workflows, and subscription billing. Built for real-life use with HIPAA-minded design.

---

## Features

### For Everyone

- **Landing & auth** — Sign up / sign in as patient or provider; JWT-based sessions with persisted login
- **Unified navigation** — Role-based dashboards and navigation (patient vs provider)

### Patient

- **Dashboard** — Overview of appointments, vitals, labs, and quick actions
- **Find Provider** — Browse providers by specialty, book appointments
- **Appointments** — View and manage scheduled visits; book telehealth or in-person
- **Telehealth** — Join video visits via [Daily.co](https://www.daily.co/); share screen, copy invite link
- **Heart Scan** — Guided scan flow with simulated vitals and AI-assisted interpretation
- **Vitals & Labs** — View and track vitals and lab results; AI lab interpretation
- **Clinical Tools** — Review of systems, clinical assessments, and treatment plans
- **Messages** — In-app messaging with providers
- **Subscription** — View plan status (free tier)

### Provider

- **Dashboard** — Schedule overview, daily appointments, quick actions, trial/subscription status
- **Schedule & Availability** — Manage availability and view schedule
- **My Patients** — Patient list and basic info
- **Telehealth** — Host video visits; start/stop recording, manage room
- **Clinical Workflow** — Full visit flow: ROS, vitals, physical exam, assessments, treatment plans, prescriptions
- **AI Scribe** — Record and transcribe visits; AI-generated summaries and optional ICD/CPT suggestions
- **Billing** — Stripe subscription: Pro plan ($199/mo) with 7-day free trial; checkout, status, and confirmation

### Platform

- **Notifications** — In-app notifications (messages, treatment plans, etc.)
- **HIPAA view** — Compliance and security overview

---

## Tech Stack

| Layer       | Stack                                                                                          |
| ----------- | ---------------------------------------------------------------------------------------------- |
| Frontend    | React 18, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS, Radix UI, Lucide icons |
| Backend     | Node.js, Express                                                                               |
| Database    | PostgreSQL 16                                                                                  |
| Telehealth  | Daily.co                                                                                       |
| Billing     | Stripe (Checkout, Subscriptions)                                                               |
| AI          | OpenAI (GPT) for scribe summarization and lab/clinical insights                                |
| PDF / Print | html2pdf.js, iframe-based print                                                                |

---

## Prerequisites

- **Node.js** 18+
- **npm** (or pnpm/yarn)
- **Docker** and **Docker Compose** (for local Postgres)
- **Git**

---

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd health-scan-vitals
npm install
```

### 2. Start PostgreSQL

```bash
docker-compose up -d
```

Postgres runs on host port **5433** to avoid conflicts with a local Postgres.

### 3. Apply database schema and seed data

```bash
docker exec -i health-scan-postgres psql -U postgres -d health_scan < server/db/schema.sql
docker exec -i health-scan-postgres psql -U postgres -d health_scan < server/db/seed.sql
```

### 4. Environment variables

Create `server/.env` (see [Environment variables](#environment-variables) below). Required for full functionality:

- Database connection
- JWT secret
- OpenAI (scribe and AI features)
- Daily.co (telehealth)
- Stripe (provider billing)

### 5. Run the app

```bash
npm run dev:all
```

- **Frontend:** [http://localhost:8080](http://localhost:8080)
- **API:** [http://localhost:3001](http://localhost:3001)

Vite proxies `/api` to the backend, so the frontend talks to the same origin in development.

---

## Environment Variables

In `server/.env`:

| Variable                | Description                              | Required for                    |
| ----------------------- | ---------------------------------------- | ------------------------------- |
| `PORT`                  | API server port (default `3001`)         | Server                          |
| `JWT_SECRET`            | Secret for signing JWTs                  | Auth                            |
| `DB_HOST`               | Postgres host (e.g. `localhost`)         | DB                              |
| `DB_PORT`               | Postgres port (e.g. `5433`)              | DB                              |
| `DB_USER`               | Postgres user                            | DB                              |
| `DB_PASSWORD`           | Postgres password                        | DB                              |
| `DB_NAME`               | Database name (e.g. `health_scan`)       | DB                              |
| `OPENAI_API_KEY`        | OpenAI API key                           | AI Scribe, summaries, diagnosis |
| `OPENAI_MODEL`          | Model name (e.g. `gpt-4o-mini`)          | AI                              |
| `DAILY_API_KEY`         | Daily.co API key                         | Telehealth                      |
| `STRIPE_SECRET_KEY`     | Stripe secret key (test or live)         | Provider billing                |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (optional) | Webhooks                        |

Example (replace with your values):

```env
PORT=3001
JWT_SECRET=your-jwt-secret
DB_HOST=localhost
DB_PORT=5433
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=health_scan
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
DAILY_API_KEY=...
STRIPE_SECRET_KEY=sk_test_...
```

**Important:** Do not commit `server/.env`. It is listed in `.gitignore`.

---

## Demo Credentials

After seeding the database:

| Role     | Email                  | Password      |
| -------- | ---------------------- | ------------- |
| Patient  | `patient@example.com`  | `password123` |
| Provider | `provider@example.com` | `password123` |

Use these to explore patient and provider flows, telehealth, AI scribe, and billing (provider).

---

## Scripts

| Command              | Description                                      |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Start Vite dev server (frontend only, port 8080) |
| `npm run dev:server` | Start Express API with watch (port 3001)         |
| `npm run dev:all`    | Run frontend and API together                    |
| `npm run build`      | Production build (Vite)                          |
| `npm run preview`    | Preview production build                         |
| `npm run lint`       | Run ESLint                                       |

---

## Project Structure

```
├── public/                 # Static assets
├── server/
│   ├── db/
│   │   ├── schema.sql      # Postgres schema
│   │   └── seed.sql        # Seed users, profiles, sample data
│   ├── db.js               # DB connection pool
│   ├── index.js            # Express app, routes, Stripe/Daily/OpenAI
│   └── .env                # Local env (not committed)
├── src/
│   ├── components/
│   │   ├── health/         # Feature views (dashboard, scan, telehealth, scribe, etc.)
│   │   ├── ui/             # Shared UI (shadcn-style)
│   │   ├── AppLayout.tsx   # Layout, routing, landing
│   │   └── ...
│   ├── contexts/           # App and user auth state
│   ├── lib/                # API client, utils
│   ├── pages/              # Top-level pages
│   └── main.tsx
├── docker-compose.yml      # Postgres 16
├── vite.config.ts         # Port 8080, /api proxy to 3001
└── package.json
```

---

## API Overview

The backend exposes REST APIs under `/api`:

- **Health:** `GET /api/health`
- **Auth:** Login/register (returns JWT); profile and role used for guards
- **Billing:** Checkout session, status, confirm-checkout, record-checkout (provider-only where applicable)
- **Telehealth:** Create room, token, instant room, validate, recording start/stop, list recordings
- **Vitals:** CRUD and range queries
- **Labs:** CRUD, bulk insert, test names, range
- **Clinical:** Assessments, patient ROS, treatment plans, acknowledge plan
- **Scribe:** Get by appointment/patient, transcribe, summarize (OpenAI), update note
- **Scans, notifications, goals:** CRUD-style endpoints
- **Functions:** `POST /api/functions/:name` for server-side helpers (e.g. AI)

All sensitive actions (billing, telehealth, scribe, etc.) expect a valid JWT and often require `role === 'provider'`.

---

## Deployment Notes

- **Frontend (e.g. Vercel):** Build with `npm run build`; set root to project root and output to `dist`. Configure env for the frontend (e.g. `VITE_API_URL`) if the API is on another origin.
- **Backend:** Run `node server/index.js` (or use the same repo and run the server elsewhere). Set `PORT`, database URL, and all env vars. For Stripe, set up webhooks and `STRIPE_WEBHOOK_SECRET` if needed.
- **Database:** Use a hosted Postgres (e.g. Supabase, Neon, RDS). Run `schema.sql` and optionally `seed.sql` (or adapt for production data).
- **Docker:** Use `docker-compose` only for local Postgres; the app itself is not containerized in this repo but can be added.

### Deploy on WHM/cPanel via GitHub

This repo now supports single-app deployment: Express serves both `/api/*` and the built React app from `dist/` in production.

1. In WHM/cPanel, create a Node.js app for account `pehd` (cPanel feature: **Setup Node.js App**):
   - **Application root:** your Git clone path (example: `/home/pehd/health-scan-vitals`)
   - **Application URL:** `pehd.org` (or your chosen subpath)
   - **Application startup file:** `server/index.js`
   - **Environment:** `production`
2. In cPanel **Git Version Control**, clone your GitHub repo into the same application root.
3. In `server/.env`, set production values (use `server/.env.example` as template).
4. Provision PostgreSQL and run:
   - `psql -U <user> -d <db> -f server/db/schema.sql`
   - `psql -U <user> -d <db> -f server/db/seed.sql` (optional)
5. On each push to `main`, use cPanel Git **Pull or Deploy**. The `.cpanel.yml` hook runs:
   - `npm ci`
   - `npm run build`
   - `npm prune --omit=dev`
   - restart signal via `tmp/restart.txt`

If your host does not auto-run deployment tasks, run this manually in app root:

```bash
npm run deploy:cpanel
```

---

## Security and Compliance

- Passwords are hashed with **bcrypt**
- JWTs for session; keep `JWT_SECRET` strong and private
- **Do not commit** `server/.env` or any keys
- The app is designed with HIPAA considerations (auth, role-based access, audit-friendly flows); for production use, complete a full compliance review and BAA with any third-party services (e.g. Daily, OpenAI, Stripe)

---

## License

Private / All rights reserved (or add your chosen license).

---

## Contributing

1. Create a branch from `main`
2. Make changes and run `npm run lint`
3. Open a pull request with a short description of the change
