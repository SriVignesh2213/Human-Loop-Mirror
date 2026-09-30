# Habit Loop Mirror — Complete Free Deployment Guide

This guide explains how to deploy the **FastAPI Backend** and **React + Vite Frontend** **100% FREE with ZERO money and NO credit card required**.

---

## ⚠️ 1. Quick Fix: Why Render Asked You for Money

If Render asked you for a credit card or payment, it happened because of one of two things:

1. **The Plan Selection Defaulted to Paid ("Starter $7/mo")**:
   When creating a Web Service on Render, the default radio button is often set to **Starter ($7/month)**.
   👉 **Fix**: Scroll down to the **Instance Type** section and click the radio button that says **Free ($0/month)**. Render's Free tier is $0 and charges nothing.

2. **Blueprint Configuration**:
   In `render.yaml`, if `plan: free` was not explicitly written, Render defaults to a paid plan.
   👉 **Fix**: We have now added `plan: free` to [`render.yaml`](file:///d:/Hackathon%20ESEC/render.yaml).

> **Note**: If Render still asks for a credit card for identity verification in your country, **use the 100% free, card-free alternatives below** (Hugging Face Spaces or LocalTunnel).

---

## ⚠️ 2. Quick Fix: The Vercel Environment Variable Error in Your Screenshot

In your screenshot, Vercel gave the error:
> `(!) The name of your Environment Variable contains invalid characters. Only letters, digits, and underscores are allowed. Furthermore, the name should not start with a digit.`

### Why It Happened:
Vercel has two separate input boxes: **Key** (the variable name) and **Value** (the actual URL). You pasted the whole instruction line into the **Key** box.

### The Correct Way:
| Field on Vercel | Exactly What to Enter |
| :--- | :--- |
| **Key** | `VITE_API_BASE_URL` |
| **Value** | `https://your-backend-url/api/v1` *(paste your real backend URL here)* |

```text
❌ WRONG (Pasting entire sentence into Key):
Key:   1. - `VITE_API_BASE_URL=https://your-backend-app.onrender.com/api/v1` 2.
Value: [blank]

✅ CORRECT:
Key:   VITE_API_BASE_URL
Value: https://your-backend-url/api/v1
```

---

## 🚀 3 100% Free Ways to Host the Backend (Pick One)

| Provider | Cost | Credit Card Needed? | Setup Time | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Method 1: Hugging Face Spaces** | **$0 Free** | ❌ **NO Credit Card** | 2 minutes | Permanent 24/7 cloud API |
| **Method 2: LocalTunnel / Cloudflare** | **$0 Free** | ❌ **NO Credit Card** | 30 seconds | Instant Hackathon demo & judging |
| **Method 3: Render (Free Tier)** | **$0 Free** | ⚠️ Sometimes (anti-abuse) | 3 minutes | Standard cloud deployment |

---

### Method 1: Hugging Face Spaces (Recommended — 100% Free Cloud, NO Card)

Hugging Face provides free Docker container hosting with 16 GB RAM and a permanent HTTPS public URL. It requires **no credit card**.

#### Steps:
1. Create a free account at [huggingface.co](https://huggingface.co/).
2. Click on your profile icon (top right) -> **New Space** (or go to [huggingface.co/new-space](https://huggingface.co/new-space)).
3. Fill in:
   - **Space name**: `habit-loop-backend`
   - **License**: `mit` or `apache-2.0`
   - **Space SDK**: Select **Docker** -> choose **Blank**.
   - **Visibility**: **Public** (Free)
4. Click **Create Space**.
5. Hugging Face will show instructions to push your repository, or you can connect your GitHub repository directly.
   - If using Git:
     ```bash
     git remote add space https://huggingface.co/spaces/YOUR_USERNAME/habit-loop-backend
     git push space main
     ```
6. The repository already has the production [`Dockerfile`](file:///d:/Hackathon%20ESEC/Dockerfile) in the root configured to expose port 7860.
7. Within 1–2 minutes, your Space will say **Running**.
8. Click the **Embed this Space** / three dots menu to see your **Direct URL**:
   ```text
   https://YOUR_USERNAME-habit-loop-backend.hf.space
   ```
9. **Your backend API URL for Vercel is**:
   ```text
   https://YOUR_USERNAME-habit-loop-backend.hf.space/api/v1
   ```
10. Test it in your browser: `https://YOUR_USERNAME-habit-loop-backend.hf.space/api/v1/health`.

---

### Method 2: LocalTunnel / Cloudflare (Instant 30-Second Hackathon Demo)

If you are presenting to hackathon judges or testing right now, you don't even need to wait for cloud builds! You can make your local running backend publicly accessible on the internet for free in 30 seconds with **one command**.

#### Steps:
1. Make sure your local backend is running in terminal:
   ```powershell
   cd "D:\Hackathon ESEC\backend"
   .\.venv\Scripts\Activate.ps1
   uvicorn backend.app.main:app --port 8000
   ```
2. Open a **new terminal window** and run:
   ```powershell
   npx localtunnel --port 8000
   ```
3. It will print a live public HTTPS URL, for example:
   ```text
   your url is: https://bright-pandas-dance.loca.lt
   ```
4. **Your backend API URL for Vercel is**:
   ```text
   https://bright-pandas-dance.loca.lt/api/v1
   ```
5. *(Alternative with Cloudflare Tunnel)*:
   ```powershell
   npx cloudflared tunnel --url http://localhost:8000
   ```
   Gives a free `https://<random>.trycloudflare.com` URL that requires zero clicks!

---

### Method 3: Render (Free Tier — If You Still Want to Use Render)

If you want to use Render without paying:

1. Go to [dashboard.render.com](https://dashboard.render.com/).
2. Click **New +** -> **Web Service** (do **NOT** click Blueprint if it asks for billing).
3. Connect your GitHub repository.
4. Set:
   - **Name**: `habit-loop-mirror-backend`
   - **Region**: Any free region (e.g. Frankfurt or Ohio)
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `uvicorn backend.app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: Select **Free ($0/month)**. (Do not select Starter!).
5. Add Environment Variables:
   - `PYTHON_VERSION`: `3.12.0`
   - `DATABASE_URL`: `sqlite:///./habit_loop_mirror.db`
6. Click **Create Web Service**. It will deploy for $0.
7. Your backend URL will be:
   ```text
   https://habit-loop-mirror-backend.onrender.com/api/v1
   ```

---

## 🌐 Deploying Frontend (Vercel — 100% Free)

Once you have your backend URL from **Method 1, 2, or 3**:

1. Go to [vercel.com](https://vercel.com/) (Sign in with GitHub).
2. Click **Add New...** -> **Project**.
3. Select your repository.
4. Set the **Root Directory**:
   - Click **Edit** next to Root Directory.
   - Choose `frontend`.
   - Click **Continue**.
5. Set **Environment Variables**:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: Your backend URL ending in `/api/v1` (e.g., `https://your-username-habit-loop-backend.hf.space/api/v1` or `https://your-tunnel.loca.lt/api/v1`).
6. Click **Deploy**.
7. In ~40 seconds, your site is live!

---

## 📋 Summary of Frontend Environment Variables

| Variable Key | Example Value | Description |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | `https://your-backend-url/api/v1` | Points frontend to the backend REST API |

> [!IMPORTANT]
> Always ensure the URL ends with `/api/v1` and does **not** have a trailing slash at the end (e.g. `https://my-backend.hf.space/api/v1`, not `https://my-backend.hf.space/api/v1/`).
