# Habit Loop Mirror — Complete Production Deployment Guide

This guide provides step-by-step instructions for deploying both the **FastAPI Backend** and the **React + Vite Frontend** to cloud providers (Render, Vercel, Railway, or Docker).

---

## ⚠️ Quick Fix for the Vercel Error in Your Screenshot

If you saw the following error on Vercel:
> `(!) The name of your Environment Variable contains invalid characters. Only letters, digits, and underscores are allowed. Furthermore, the name should not start with a digit.`

### Why It Happened
In Vercel, the environment variable configuration is divided into **two separate input boxes**:
1. **Key** (the variable name)
2. **Value** (the variable content)

You pasted the entire markdown sentence into the **Key** box.

### The Correct Way to Fill It In:
| Field on Vercel | Exactly What to Enter |
| :--- | :--- |
| **Key** | `VITE_API_BASE_URL` |
| **Value** | `https://your-backend-app.onrender.com/api/v1` *(Replace with your real backend URL)* |

```text
❌ WRONG (Pasting entire line into Key):
Key:   1. - `VITE_API_BASE_URL=https://your-backend-app.onrender.com/api/v1` 2.
Value: [blank]

✅ CORRECT:
Key:   VITE_API_BASE_URL
Value: https://your-backend-app.onrender.com/api/v1
```

---

## Architecture Overview

```
                      +-----------------------------+
                      |   Client Browser (User)     |
                      +--------------+--------------+
                                     |
              +----------------------+----------------------+
              |                                             |
              v                                             v
+-----------------------------+             +-------------------------------+
|      Frontend (Vercel)      |             |       Backend (Render)        |
|  - React 18 + Vite + TS     |             |  - FastAPI + Python 3.12      |
|  - Tailwind Dark Telemetry  |  API Calls  |  - Deterministic Habit Engine |
|  - SPA Routing (vercel.json)| ----------> |  - ReportLab PDF Generator    |
|  - Port: 443 (HTTPS)        |  (REST/CSV) |  - SQLite / PostgreSQL        |
+-----------------------------+             +-------------------------------+
```

---

## Step 1: Deploy Backend (Render.com - Free Tier)

Deploy the FastAPI backend first so you have its live URL ready before deploying the frontend.

### Option A: Using Render Blueprint (`render.yaml`) — Recommended
The repository already contains a pre-configured `render.yaml` blueprint.

1. Go to [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Blueprint**.
2. Connect your GitHub repository.
3. Render will automatically detect `render.yaml` and configure:
   - **Service Name**: `habit-loop-mirror-backend`
   - **Environment**: Python 3.12
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
4. Click **Apply**.

---

### Option B: Manual Web Service Setup on Render
1. In Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the settings:
   - **Name**: `habit-loop-mirror-backend`
   - **Region**: Oregon (US West) or Frankfurt (EU)
   - **Branch**: `main` (or your active branch)
   - **Root Directory**: *(leave blank — repository root)*
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`

4. Scroll down to **Environment Variables** and add:

| Key | Value | Notes |
| :--- | :--- | :--- |
| `PYTHON_VERSION` | `3.12.0` | Ensures Python 3.12 compatibility |
| `DATABASE_URL` | `sqlite:///./habit_loop_mirror.db` | Zero-config database |
| `KIMI_API_KEY` | *(Optional - your Moonshot API Key)* | Leave blank for built-in deterministic insights |
| `KIMI_BASE_URL` | `https://api.moonshot.cn/v1` | Moonshot / Kimi endpoint |
| `KIMI_MODEL` | `moonshot-v1-8k` | Default AI model |

5. Click **Create Web Service**.
6. Wait 2–3 minutes for deployment to finish.
7. Once deployed, copy your live backend URL from the top of the Render page:
   ```text
   https://habit-loop-mirror-backend.onrender.com
   ```
8. **Verify Backend Health**: Open in your browser:
   `https://habit-loop-mirror-backend.onrender.com/api/v1/health`
   You should see:
   ```json
   {
     "success": true,
     "data": {
       "status": "healthy",
       "database": "connected",
       "version": "1.0.0"
     },
     "message": "Habit Loop Mirror API operational"
   }
   ```

> [!NOTE]
> **Free Tier Sleep Behavior**: Render's free tier spins down after 15 minutes of inactivity. When a request arrives, it takes ~30 seconds to wake up.

---

## Step 2: Deploy Frontend (Vercel)

Now connect the frontend to your live backend.

1. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
2. Select your GitHub repository and click **Import**.
3. In the **Configure Project** screen:

### 1. Framework Preset & Root Directory
- **Framework Preset**: `Vite` (Vercel will auto-detect this once root directory is set)
- **Root Directory**: Click **Edit** next to Root Directory, select the `frontend` folder, and click **Continue**.

### 2. Build and Output Settings
*(Vercel defaults are correct once `frontend` is selected)*
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Environment Variables
Click **Environment Variables** to expand the section. Add the variable:

| Key | Value |
| :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-backend-app.onrender.com/api/v1` |

*(Make sure you replace `your-backend-app.onrender.com` with your real Render backend hostname from Step 1, and ensure it ends with `/api/v1`)*.

4. Click **Deploy**.
5. Vercel will install dependencies, run `tsc && vite build`, and publish your app in ~45 seconds.
6. Click the deployed URL (e.g. `https://habit-loop-mirror.vercel.app`) to view the application live!

---

## Step 3: SPA Routing Configuration (`vercel.json`)

The repository already includes `frontend/vercel.json`:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```
This guarantees that direct page refreshes on client-side routes like `/overview`, `/digital-day`, `/reflection`, `/goals`, and `/settings` will not return 404 errors.

---

## Step 4: CORS Configuration

The backend is configured in [`backend/app/main.py`](file:///d:/Hackathon%20ESEC/backend/app/main.py#L45-L53) with:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
This allows requests from:
- `http://localhost:5173` (local development)
- Any `https://*.vercel.app` preview or production deployment domain

---

## Alternative: Full-Stack Deployment on Railway.app

If you prefer deploying both the frontend and backend on a single platform with zero cold starts:

1. Create an account at [Railway.app](https://railway.app/).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. **For Backend Service**:
   - Root Directory: `backend` (or repo root)
   - Start Command: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - Add environment variable `PORT=8000`.
   - Under Settings -> Networking, click **Generate Domain** (e.g. `habit-backend.up.railway.app`).
4. **For Frontend Service**:
   - Add another service from the same repo.
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Environment Variable: `VITE_API_BASE_URL=https://habit-backend.up.railway.app/api/v1`
   - Under Settings -> Networking, click **Generate Domain**.

---

## Alternative: Docker Deployment (VPS / Self-Hosted / AWS / DigitalOcean)

To deploy with Docker on an Ubuntu/Debian VPS:

### 1. Backend Dockerfile
Create `Dockerfile` in the root:
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ /app/backend/

EXPOSE 8000

CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 2. Frontend Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## Post-Deployment Verification Checklist

Once both services are deployed, test the following end-to-end journey on your live site:

1. [ ] **Health Check**: Open `https://<backend-url>/api/v1/health` and verify `{"status": "healthy"}`.
2. [ ] **Overview Page**: Open your Vercel URL. Confirm the telemetry dashboard loads without a 500 error.
3. [ ] **Import Demo Data**:
   - Click **Import Usage CSV** in the top navigation bar.
   - Click **Load Live Demo Dataset (7 Days)**.
   - Confirm sessions are imported and pattern analysis runs with live relative dates.
4. [ ] **PDF Export**:
   - Click **Download PDF** on the Overview header or in Settings.
   - Verify the downloaded PDF opens with the full telemetry tables and insights.
5. [ ] **Settings Profile Editing**:
   - Change your Display Name and Account Email in `/settings` and click **Save Profile Changes**.
   - Verify the top-right header avatar updates immediately.
6. [ ] **Clear Usage**:
   - Click **Clear Usage** in Settings and confirm.
   - Verify that `/reflection` and `/goals` reset to empty states.

---

## Troubleshooting FAQ

### Q1: Vercel shows "The name of your Environment Variable contains invalid characters"
- **Solution**: Make sure only `VITE_API_BASE_URL` is typed into the **Key** field, and your URL (`https://.../api/v1`) is typed into the **Value** field.

### Q2: Frontend says "Could not load telemetry summary" / Network Error
- **Solution**:
  1. Check if Render is waking up from sleep (wait 30 seconds and refresh).
  2. Verify that `VITE_API_BASE_URL` in Vercel includes the `/api/v1` suffix (e.g. `https://my-backend.onrender.com/api/v1`).
  3. Ensure there is **no trailing slash** after `/api/v1`.

### Q3: 404 Not Found when refreshing pages like `/settings`
- **Solution**: Verify that `frontend/vercel.json` exists in the repository with the rewrite rule to `/index.html`.

### Q4: Database resets on Render free tier restart
- **Solution**: SQLite stored inside free container filesystems is ephemeral. For persistent cloud storage across restarts:
  1. Create a free PostgreSQL database on [Supabase](https://supabase.com/) or [Neon.tech](https://neon.tech/).
  2. Set `DATABASE_URL=postgresql://user:password@host:5432/dbname` in Render Environment Variables.
  3. SQLAlchemy will automatically connect to PostgreSQL and create the schema on startup.
