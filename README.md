# Habit Loop Mirror

> **"Screen Time tells you how much. We tell you why."**\
 **Understand the patterns behind your digital habits.*

---

## 1. Product Overview

**Habit Loop Mirror** is an awareness and behavioral self-regulation platform designed to replace raw, guilt-inducing screen time metrics with explainable, evidence-based habit awareness.

### The 5-Stage Behavioral Mirror Loop:

1. **DETECT**: Correlates direct application notifications with session start timestamps (within 3 minutes) and isolates recurring multi-day clusters.
2. **EXPLAIN**: Breaks down the habit loop into Trigger, Action, Latency, and Duration impact without clinical or judgmental terminology.
3. **REFLECT**: Allows users to categorize session intentionality (`Planned`, `Necessary`, `Relaxation`, `Unplanned`).
4. **SUBSTITUTE**: The **Personal Swap** engine suggests 2-minute, 10-minute, or 20-minute meaningful alternatives based strictly on user onboarding preferences.
5. **IMPROVE**: Tracks verified multi-week habit evolution and calculates true reclaimed time without fabrication.

### Core Ethical Guidelines:

- **Awareness & Self-Regulation Tool**: Not a medical treatment, clinical diagnosis, addiction cure, or dopamine detox.
- **Sublimation-Inspired**: Redirects recurring impulses into positive, self-chosen offline or creative crafts.
- **Non-Judgmental Language**: Uses objective phrasing like *"session followed notification"* rather than claiming direct causation.

---

## 2. Architecture & Tech Stack

```
   Browser (React + TypeScript + Vite + Tailwind CSS)
                       │  (Bearer JWT)
                       ▼
       FastAPI Telemetry Backend (Python 3.12+)
       ├── Python Analytics Engine (pandas / NumPy / scikit-learn)
       ├── Deterministic Task Engine (Personal Swap Filter)
       └── Kimi K3 AI Client (Moonshot AI Adapter with Deterministic Fallback)
                       │
       ┌───────────────┴───────────────┐
       ▼                               ▼
Supabase PostgreSQL / SQLite     Moonshot AI (Kimi K3)
```

- **Frontend**: React 18, TypeScript, Vite, React Router 6, Tailwind CSS, Lucide React, Framer Motion
  - **Onboarding Aesthetic**: Warm cream, terracotta, and sage journal-like cards.
  - **Dashboard Aesthetic**: Architectural dark mode with deep slate surfaces and restrained teal telemetry accents.
- **Backend**: Python 3.12+, FastAPI, Uvicorn, SQLAlchemy 2.0, Alembic, Pydantic v2, HTTPX, PyJWT.
- **Database**: PostgreSQL (Supabase in production, SQLite zero-config local dev fallback).
- **Authentication**: Supabase Auth with JWT validation and local development demo mode.
- **AI Integration**: Kimi K3 (Moonshot AI) with ground-truth Python analytics evidence and deterministic offline fallback.

---

## 3. Directory Layout

```
.
├── backend/
│   ├── app/
│   │   ├── api/v1/          # Endpoints: health, users, usage, dashboard, digital-day, etc.
│   │   ├── analytics/       # Pure Python analytics & habit loop detection engine
│   │   ├── services/ai/     # Kimi K3 adapter with deterministic fallback
│   │   ├── services/        # Deterministic personalized task engine & activity seed
│   │   ├── models/          # SQLAlchemy ORM models with UUID primary keys
│   │   ├── schemas/         # Pydantic v2 schemas & standard API response contracts
│   │   ├── utils/           # Structured JSON logger & CSV validator
│   │   ├── config.py        # Settings & configurable analytics thresholds
│   │   └── main.py          # FastAPI application entry point
│   ├── alembic/             # Database migrations
│   ├── tests/               # Pytest automated test suite
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/      # UI components: MetricCard, HabitLoopCard, InsightCard, etc.
│   │   ├── context/         # AuthContext & session management
│   │   ├── pages/           # Public (Landing, Login, Signup, Onboarding) & Protected pages
│   │   ├── services/        # Typed API service modules (no fetch in UI components)
│   │   └── types/           # TypeScript interfaces matching backend models
│   ├── package.json
│   ├── vercel.json
│   └── .env.example
├── examples/
│   └── sample_usage.csv     # Deterministic demo dataset for evaluation
├── docs/
│   └── API.md               # Complete API endpoint specifications
├── render.yaml              # Render deployment configuration
└── README.md
```

---

## 4. Local Development Setup

### Prerequisites

- Node.js v18+ and npm
- Python 3.12+

### Step 1: Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Run FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```

The backend API is now running at `http://localhost:8000`.\
Interactive Swagger docs: `http://localhost:8000/docs`\
Health check: `http://localhost:8000/api/v1/health`

### Step 2: Frontend Setup

```bash
cd frontend

# Install npm packages
npm install

# Copy environment template
cp .env.example .env

# Start Vite development server
npm run dev
```

The frontend is now available at `http://localhost:5173`.

---

## 5. Instant Demo & Evaluation Walkthrough

To verify the complete user journey end-to-end:

1. Open `http://localhost:5173`
2. Click **Start Your Habit Mirror** or navigate to `/signup`
3. Enter test credentials (or click **Explore Instant Demo Mode** on `/login`)
4. Complete the 6-step **Personalization Onboarding Journal**
5. On the dashboard, click **Import Usage CSV** in the header
6. Click **Load Bundled Demo Dataset** and click **Import & Analyze**
7. The dashboard immediately renders:
   - Total screen time and peak usage period
   - Primary detected habit loop (e.g., Instagram evening alert loop)
   - Explainable AI Insight with evidence points
   - Interactive Personal Swap cards (2m, 10m, 20m tiers)
   - Today's Goal and Chronological Digital Day stream

---

## 6. Supabase & Kimi AI Configuration

### Supabase Setup (Production Auth & PostgreSQL)

1. Create a project at [supabase.com](https://supabase.com).
2. Under **Project Settings → Database**, copy the PostgreSQL connection string URI and set `DATABASE_URL` in `backend/.env`.
3. Under **Project Settings → API**, copy:
   - Project URL -&gt; `VITE_SUPABASE_URL` (frontend) & `SUPABASE_URL` (backend)
   - `anon` `public` key -&gt; `VITE_SUPABASE_ANON_KEY` (frontend)
   - JWT Secret -&gt; `SUPABASE_JWT_SECRET` (backend)

### Kimi K3 (Moonshot AI) Configuration

1. Obtain an API key from [platform.moonshot.cn](https://platform.moonshot.cn/).
2. In `backend/.env`, set:

   ```env
   KIMI_API_KEY=your_actual_key_here
   KIMI_BASE_URL=https://api.moonshot.cn/v1
   KIMI_MODEL=moonshot-v1-8k
   ```

*Note: If* `KIMI_API_KEY` *is not provided, the system automatically uses verified deterministic evidence templates, ensuring the application remains 100% functional without external API keys.*

---

## 7. Testing

### Run Backend Tests

```bash
cd backend
.venv\Scripts\pytest -v
```

### Run Frontend Build & Typecheck

```bash
cd frontend
npm run build
```

---

## 8. Deployment Guide

See the complete, detailed deployment walkthrough in [**DEPLOYMENT.md**](./DEPLOYMENT.md).

### Frontend Deployment (Vercel)

1. Push repository to GitHub.
2. In Vercel, click **Add New... → Project** and import the repository.
3. Set **Root Directory** to `frontend`.
4. In **Environment Variables**, enter:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://your-backend-app.onrender.com/api/v1` *(replace with your live backend URL)*
5. Click **Deploy**. SPA routing rewrites are pre-configured via `frontend/vercel.json`.

### Backend Deployment (Render)

1. In Render, select **New → Blueprint** and select `render.yaml`.
2. Configure the environment variables (`DATABASE_URL`, `KIMI_API_KEY`).
3. Click **Apply**. Verify database connectivity at `https://<your-backend>.onrender.com/api/v1/health`.