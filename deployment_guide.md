# Cloud Deployment Guide — Sample Registration Portal

This guide provides complete, step-by-step instructions for deploying the **Sample Registration Portal** to the cloud so your boss, colleagues, or clients can access the portal from any computer or mobile phone.

---

## Deployment Options Summary

| Deployment Option | Setup Time | Credit Card Required? | 24/7 Cloud Hosting? | Best For |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1: Instant Tunnel (`share.bat`)** | 1 minute | **No** | No (runs while PC is ON) | Immediate live demos to boss/team |
| **Option 2A: Render Manual Setup** | 8 minutes | **No** | **Yes** | 24/7 free cloud deployment without credit card |
| **Option 2B: Render Blueprint (`render.yaml`)** | 3 minutes | Card on file (0$ charge) | **Yes** | 1-click automated cloud deployment |
| **Option 3: Vercel + Render + Supabase** | 12 minutes | **No** | **Yes** | Ultra-fast Next.js CDN performance |
| **Option 4: Docker VPS (AWS / Hetzner)** | 20 minutes | Yes (~$5/mo) | **Yes** | Enterprise custom domain & full privacy |

---

## Option 1: Quick Instant Share via `share.bat` (Local Tunnel)

Use this option if you need a **shareable public link in 1 minute** without creating any cloud account.

### Prerequisites
* Your laptop/PC must be turned on with `start.bat` running in the background.
* Node.js installed on your computer.

### Step-by-Step Instructions

1. **Launch Local Application**:
   * Double-click `start.bat` in the project root folder.
   * Ensure backend (`http://localhost:8000`) and frontend (`http://localhost:3000`) are active.

2. **Generate Cloud Tunnel Link**:
   * Double-click `share.bat` in the project root folder.
   * The script automatically launches `localtunnel` bound to IPv4 (`127.0.0.1:3000`), avoiding Windows IPv6 Bad Gateway issues.

3. **Retrieve & Share the URL**:
   * In the command window, locate the generated URL:
     ```text
     your url is: https://xxxx-xxxx-xxxx.loca.lt
     ```
   * Copy this URL and send it to your boss or team.

4. **First-Time Access Instructions for Users**:
   * When opening `https://...loca.lt` for the first time, localtunnel displays a security verification page.
   * Users copy the public IP address shown on screen into the input box and click **"Click to Continue"**.

---

## Option 2: Render.com 24/7 Full Stack Cloud Deployment

Deploy the PostgreSQL database, FastAPI backend, and Next.js frontend to **Render.com** for a permanent `https://your-app.onrender.com` link that runs 24/7 even when your laptop is powered off.

---

### Method 2A: Render Manual Component Setup (NO Credit Card Required 💳❌)

This method creates free individual services without requiring a credit card.

#### Step 1: Create Free PostgreSQL Database
1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click **New +** -> **PostgreSQL**.
3. Configure settings:
   * **Name**: `sample-portal-db`
   * **Database**: `sample_portal`
   * **Plan**: **Free**
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (e.g. `postgres://sample_portal_user:...@dpg-xxxx/sample_portal`).
   *(Note: Our backend automatically normalizes `postgres://` to `postgresql://` required by SQLAlchemy).*

#### Step 2: Create Free FastAPI Backend Web Service
1. On Render dashboard, click **New +** -> **Web Service**.
2. Connect repository: `suhaodatascichem/Sample-Registration-Portal`.
3. Configure Backend settings:
   * **Name**: `sample-registration-portal` *(or your preferred backend name)*
   * **Root Directory**: `backend`
   * **Language / Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   * **Instance Type**: **Free**
4. Add **Environment Variables**:
   * `DATABASE_URL`: *(Paste Internal Database URL from Step 1)*
   * `GEMINI_API_KEY`: *(Paste your Google Gemini API key)*
5. Click **Create Web Service**.
6. Copy your live backend URL (e.g. `https://sample-registration-portal.onrender.com`).

#### Step 3: Create Free Next.js Frontend Web Service
1. On Render dashboard, click **New +** -> **Web Service**.
2. Connect repository: `suhaodatascichem/Sample-Registration-Portal`.
3. Configure Frontend settings:
   * **Name**: `sample-portal-frontend`
   * **Root Directory**: `frontend`
   * **Language / Environment**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npx next start -p $PORT`
   * **Instance Type**: **Free**
4. Add **Environment Variable**:
   * `NEXT_PUBLIC_API_URL`: `https://sample-registration-portal.onrender.com` *(Must match your exact live backend Render URL)*
5. Click **Create Web Service**.

> ⚠️ **CRITICAL NEXT.JS STEP**:
> In Next.js, `NEXT_PUBLIC_API_URL` is baked into JavaScript files at **build time**.
> Whenever you add or edit `NEXT_PUBLIC_API_URL` in Render Environment Variables, you **MUST** click **Manual Deploy** -> **Clear Build Cache & Deploy** on the frontend service so Next.js re-compiles with your live backend URL!

---

### Method 2B: Render 1-Click Blueprint (`render.yaml`)

Automates the creation of database, backend, and frontend using the repository's [render.yaml](file:///c:/AI%20project/Sample%20Registration%20Portal/Sample-Registration-Portal/render.yaml) blueprint file.

1. Go to Render Dashboard -> **New +** -> **Blueprint**.
2. Connect `suhaodatascichem/Sample-Registration-Portal`.
3. Render reads `render.yaml` and configures all 3 services automatically.
4. Enter your `GEMINI_API_KEY` when prompted and click **Apply**.
   *(Note: Render may request a credit card verification on file for Blueprint execution, though 0$ is charged for free tier).*

---

## Option 3: Vercel (Frontend) + Render / Supabase (Backend & DB)

Provides ultra-fast frontend page loads via Vercel's Global Edge Network.

1. **Database**: Create free PostgreSQL project on [Supabase.com](https://supabase.com).
2. **Backend**: Follow Method 2A Step 2 to deploy FastAPI on Render.
3. **Frontend**: Go to [Vercel.com](https://vercel.com) -> **New Project** -> Import `suhaodatascichem/Sample-Registration-Portal` -> Set Root Directory to `frontend` -> Add `NEXT_PUBLIC_API_URL` = `https://your-backend.onrender.com` -> Click **Deploy**.

---

## Option 4: Docker Compose on VPS (AWS / Hetzner / DigitalOcean)

For corporate deployments requiring custom SSL domains (e.g. `https://samples.yourcompany.com`).

```bash
git clone https://github.com/suhaodatascichem/Sample-Registration-Portal.git
cd Sample-Registration-Portal
# Configure backend/.env with GEMINI_API_KEY and POSTGRES passwords
docker-compose up -d --build
```

---

## Troubleshooting Guide

### 1. `Failed to fetch` when clicking "Extract Samples with AI"
* **Cause**: Frontend `NEXT_PUBLIC_API_URL` environment variable is either pointing to a placeholder URL (`sample-portal-backend.onrender.com`), missing `https://`, or was not re-built after updating.
* **Fix**:
  1. Set `NEXT_PUBLIC_API_URL` in Render Frontend Environment Variables to your **exact live backend Render URL** (e.g. `https://sample-registration-portal.onrender.com`).
  2. Click **Manual Deploy** -> **Clear Build Cache & Deploy** on the frontend service.

### 2. Backend Cold Start Delay (~30 seconds)
* **Cause**: Render Free Tier puts backend services to sleep after 15 minutes of inactivity.
* **Fix**: Open `https://<your-backend-name>.onrender.com/` in a browser tab to wake up the backend container (~30s) on first launch.

### 3. `Could not import module "main"`
* **Cause**: Start Command set to `uvicorn main:app` instead of `uvicorn app.main:app`.
* **Fix**: Ensure backend Start Command is `uvicorn app.main:app --host 0.0.0.0 --port $PORT` because `main.py` resides inside `backend/app/`.

### 4. Frontend `404 Not Found` when opening direct URL
* **Cause**: Next.js start command listening on default port 3000 instead of Render's dynamic `$PORT`.
* **Fix**: Ensure frontend Start Command is `npx next start -p $PORT`.

### 5. PostgreSQL `postgres://` vs `postgresql://` URL Scheme
* **Cause**: Render database connection strings start with `postgres://`, which SQLAlchemy 1.4+ rejects.
* **Fix**: Backend automatically normalizes `postgres://` to `postgresql://` in `app/config.py` and `app/database.py`.
