# Cloud Deployment Guide — Sample Registration Portal

This guide provides step-by-step instructions for deploying the **Sample Registration Portal** so that your boss, colleagues, or clients can access the portal from any computer or mobile phone.

---

## Overview of Deployment Strategies

| Strategy | Setup Time | Cost | Best For | 24/7 Availability |
| :--- | :--- | :--- | :--- | :--- |
| **Option 1: Quick Tunnel (share.bat)** | 1 minute | Free | Immediate live demos to boss/team | Only when PC is ON |
| **Option 2: Render.com (Full Stack)** | 10 minutes | Free | 24/7 public website link | Yes |
| **Option 3: Vercel + Render + Supabase** | 15 minutes | Free | Production-grade speed & CDN | Yes |
| **Option 4: Docker VPS (AWS / Hetzner)** | 20 minutes | ~$5/month | Custom corporate domain & total privacy | Yes |

---

## Option 1: Quick Instant Share via `share.bat` (Easiest & Fastest)

Use this option if you need an **instant shareable URL** right now without creating cloud accounts.

### Prerequisites
* Your laptop/PC must be turned on.
* Node.js installed on your computer.

### Step-by-Step Instructions

1. **Start Local Application**:
   * Double-click `start.bat` in the project root folder.
   * Verify that both backend (`http://localhost:8000`) and frontend (`http://localhost:3000`) are running.

2. **Generate Cloud Tunnel Link**:
   * Double-click `share.bat` in the project root folder.
   * The script will execute `localtunnel` bound to IPv4 (`127.0.0.1:3000`).

3. **Retrieve the URL**:
   * In the command window, locate the generated URL:
     ```text
     your url is: https://xxxx-xxxx-xxxx.loca.lt
     ```
   * Copy this URL and send it to your boss or team.

4. **First Time Access Instructions for Users**:
   * When users open `https://...loca.lt` for the first time, localtunnel displays a security splash page.
   * Users copy the public IP address displayed on screen into the input box and click **"Click to Continue"**.
   * The portal will load completely.

---

## Option 2: Render.com Full Stack Cloud Deployment (24/7 Free Hosting)

Deploy the database, backend, and frontend to **Render.com** for a permanent `https://your-app.onrender.com` link that runs 24/7 even when your laptop is powered off.

### Step 1: Create PostgreSQL Database on Render

1. Sign up / Log in to [Render.com](https://render.com).
2. Click **New +** -> **PostgreSQL**.
3. Fill in database details:
   * **Name**: `sample-portal-db`
   * **Database**: `sample_portal`
   * **Plan**: Free
4. Click **Create Database**.
5. Once created, copy the **Internal Database URL** (or **External Database URL**).

### Step 2: Deploy FastAPI Backend Web Service

1. On Render dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository: `suhaodatascichem/Sample-Registration-Portal`.
3. Configure Backend settings:
   * **Name**: `sample-portal-backend`
   * **Root Directory**: `backend`
   * **Environment**: `Python 3`
   * **Build Command**: `pip install -r requirements.txt`
   * **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add **Environment Variables**:
   * `DATABASE_URL`: *(Paste the PostgreSQL URL from Step 1)*
   * `GEMINI_API_KEY`: *(Paste your Google Gemini API key)*
5. Click **Create Web Service**.
6. Copy your live backend URL (e.g. `https://sample-portal-backend.onrender.com`).

### Step 3: Deploy Next.js Frontend Web Service

1. On Render dashboard, click **New +** -> **Web Service**.
2. Select the same GitHub repository: `suhaodatascichem/Sample-Registration-Portal`.
3. Configure Frontend settings:
   * **Name**: `sample-portal-frontend`
   * **Root Directory**: `frontend`
   * **Environment**: `Node`
   * **Build Command**: `npm install && npm run build`
   * **Start Command**: `npm run start`
4. Add **Environment Variable**:
   * `NEXT_PUBLIC_API_URL`: `https://sample-portal-backend.onrender.com/api`
5. Click **Create Web Service**.
6. Once deployed, click the generated link (e.g. `https://sample-portal-frontend.onrender.com`).

---

## Option 3: Vercel (Frontend) + Supabase (Database) + Render (Backend)

For maximum frontend loading speed and global CDN distribution.

### Step 1: Provision Database on Supabase
1. Go to [Supabase.com](https://supabase.com) and create a free project.
2. In **Project Settings** -> **Database**, copy your Connection String URI.

### Step 2: Deploy Backend on Render or Railway
1. Follow Step 2 from Option 2 above using the Supabase connection string.

### Step 3: Deploy Frontend on Vercel
1. Go to [Vercel.com](https://vercel.com) and click **Add New** -> **Project**.
2. Import repository `suhaodatascichem/Sample-Registration-Portal`.
3. Set **Root Directory** to `frontend`.
4. In **Environment Variables**, add:
   * Key: `NEXT_PUBLIC_API_URL`
   * Value: `https://your-backend-url.onrender.com/api`
5. Click **Deploy**. Vercel will build and assign a `.vercel.app` domain within 60 seconds.

---

## Option 4: Docker Compose on Cloud Server (AWS / DigitalOcean / Hetzner)

For corporate deployments requiring custom SSL domains (e.g. `https://samples.yourcompany.com`).

### Prerequisites
* A Linux server (Ubuntu 22.04 LTS / Debian 12).
* Docker & Docker Compose installed.

### Step-by-Step Instructions

1. **SSH into Server**:
   ```bash
   ssh root@your-server-ip
   ```

2. **Clone Project Repository**:
   ```bash
   git clone https://github.com/suhaodatascichem/Sample-Registration-Portal.git
   cd Sample-Registration-Portal
   ```

3. **Create Environment File**:
   Create a `.env` file inside `backend/`:
   ```env
   GEMINI_API_KEY=your_google_gemini_api_key
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=sample_portal
   ```

4. **Launch Containers**:
   ```bash
   docker-compose up -d --build
   ```

5. **Verify Running Services**:
   ```bash
   docker-compose ps
   ```

---

## Troubleshooting & FAQs

### Q: Why did localtunnel show "Bad Gateway"?
**A**: On Windows systems, localtunnel by default attempts to connect to `localhost` via IPv6 (`[::1]:3000`). Next.js dev server listens on IPv4 (`127.0.0.1:3000`). We fixed this in `share.bat` by appending `--local-host 127.0.0.1`.

### Q: Is Gemini API key safe when shared?
**A**: The `GEMINI_API_KEY` is strictly stored on the backend server (`backend/.env`). It is never exposed to frontend client browsers.

### Q: How do I update the live website after modifying code?
**A**: For Options 2, 3, and 4, simply commit and push your changes to GitHub (`git commit` and `git push`). Render, Vercel, and CI/CD pipelines will automatically rebuild and deploy your updates.
