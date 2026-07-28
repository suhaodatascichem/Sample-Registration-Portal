# 📊 Project Status & Refactoring Record

This document records the current status of the **Lab Sample Intake Portal** project, including refactorings, theme changes, build resolutions, and git status.

---

## 🛠️ Modifications & Refactoring History

### 1. 🔤 Brand & Label Renaming
*   **Webpage Title & Logo**: Renamed the logo brand in the main navigation header from **"AuraLIMS"** to **"Sample Registration"** in `Navbar.tsx`.
*   **Submitter Name Field**: Renamed labels and error validations from **"CUSTOMER/SUBMITTER NAME"** to **"Submitter Name"** on the main dashboard (`page.tsx`) and the review dashboard (`review/page.tsx`).
*   **Grid Column Header**: Renamed the first grid column from **"Customer / Submitter"** to **"Customer ID"** in `SampleGrid.tsx` to match the customer relationship mapping model.

### 🎨 2. Theme Transition (Light Mode)
*   **Background**: Changed the default webpage background from deep dark (`#0b0f19`) to a clean white and slate-50 gradient (`#ffffff` / `#f8fafc`).
*   **Typography**: Remapped all dark-mode text helper classes (like `text-slate-100` through `text-slate-400` and `text-white`) to high-contrast slate grays and dark slate-900.
*   **Glassmorphism**: Adjusted card backdrops to semi-translucent light white layers (`rgba(255, 255, 255, 0.7)`) with a subtle purple glow drop-shadow.
*   **AG Grid Theme**: Refactored the AG Grid styling overrides in `globals.css` so that the grid displays with a clean light layout, slate headers, and soft purple hover/selection row backgrounds.

### ⚙️ 3. Portable Startup Script & Self-Healing Setup (`start.bat`)
*   **Node.js PATH Detection**: Added automatic detection for `C:\Program Files\nodejs` if `npm` is not in system PATH.
*   **Automated Dependency Provisioning**: Automatically detects missing Python virtual environment (`.venv`) or `node_modules` and provisions them automatically (`pip install`, `npm install`).
*   **Direct Window Launching**: Streamlined batch execution to launch both FastAPI Backend (`port 8000`) and Next.js Frontend (`port 3000`) reliably in dual command windows.

### ✍️ 4. Text Intake & Range Expansion
*   **`TextIntake.tsx` Component**: Introduced a primary text intake window on the left side of the dashboard featuring a large text area, preset template chips (e.g. *Japfa Indonesia Batch*), character counts, and AI extraction.
*   **Backend Endpoint (`/api/ai/process-text`)**: Added structured text parsing endpoint in `ai.py` and `schemas.py`.
*   **LLM Range Expansion Prompt Rules**: Enhanced `ai_service.py` system prompt to instruct LLMs to expand shorthand sample counts and ranges (e.g., *"4 broiler grower feed samples... 1001 to 1004"*) into individual sample items.
*   **Dashboard Layout Realignment**: Re-architected `page.tsx` grid layout: Text Intake placed prominently in a large left-side window (`lg:col-span-7`), with Voice Intake and Photo Scanner stacked vertically on the right (`lg:col-span-5`).

### 🤖 5. Google Gemini SDK Migration (`google-genai`)
* **SDK Upgrade**: Migrated backend AI services from OpenAI to official Google GenAI SDK (`google-genai`).
* **Model Selection**: Standardized on model **`gemini-flash-latest`** with fallback to `gemini-2.0-flash`.
* **Structured JSON Extraction**: Enforces Pydantic schema validation for text notes, audio transcription, and image vision OCR.

### 📊 6. Custom Columns & Grid Extensions
* **Header Inputs**: Added `Customer Mac. no` input field in the top header bar alongside `Submitter Name`.
* **Table Columns**:
  * Added **`Mac. no`** as the first column in front of the table in `SampleGrid.tsx`.
  * Added **`Contact Person`** as the last column at the end of the table representing lab personnel.
* **LIMS CSV Export**: Updated `export_service.py` to export `MacNo` and `ContactPerson` fields into generated CSV files.

### 🌐 7. Cloud Deployment & Tunnel Sharing (`share.bat` & Render.com)
* **`share.bat` Script**: Added 1-click cloud tunnel script using `localtunnel` bound to IPv4 (`127.0.0.1:3000`) for instant public link generation without cloud accounts.
* **Render Blueprint (`render.yaml`)**: Created automated Blueprint deployment specification for Render.com.
* **Deployment Guide (`deployment_guide.md`)**: Comprehensive documentation covering local tunnel sharing, Render manual setup (No credit card required), Render Blueprint setup, Vercel + Supabase, and Docker VPS hosting.

### 📄 8. CSV Styling, Custom Export Filenames, Submitter Uncoupling & Sequential Batch IDs
* **LIMS CSV Button**: Redesigned download button to a vibrant high-contrast Emerald Green button (`bg-emerald-600`) on the Manifest page.
* **Export Filename**: CSV download endpoint now generates custom filenames formatted as `{DDMMYYYY}_{CustomerName}_{SampleCount}samples.csv` (e.g. `28072026_SmithFarms_5samples.csv`).
* **Uncoupling Submitter & Company**: Separated inputs into **Company Name** (the corporate customer) and **Submitter Name** (the individual submitter/contact person), removing auto-linking.
* **Sequential Batch IDs**: Batches automatically receive sequential numbers starting from **1000** (e.g., `#1000`, `#1001`, `#1002`...) displayed across UI, QR codes, and CSV exports.

---

## 🛰️ Git Repository Status

* **Repository Location**: `c:\AI project\Sample Registration Portal\Sample-Registration-Portal`
* **Ignored Files (via `.gitignore`)**:
    * Python virtual environments (`backend/.venv/`, `backend/.pytest_cache/`, `*.pyc`)
    * Sensitive credentials (`backend/.env`)
    * Node/Next modules and caches (`frontend/node_modules/`, `frontend/.next/`)
* **GitHub Remote**: `https://github.com/suhaodatascichem/Sample-Registration-Portal`
* **Main Branch**: `main` (tracked with `origin/main`)

---

## 🏃 Run State

* **Database**: PostgreSQL runs inside Docker container `lab-postgres` mapping container port `5432` to host port `5433` locally, or managed PostgreSQL on Render.
* **FastAPI Backend**: Runs on `http://localhost:8000` locally, or `https://sample-registration-portal.onrender.com` on Render.
* **Next.js Frontend**: Runs on `http://localhost:3000` locally, or `https://sample-portal-frontend.onrender.com` on Render.
* **AI Mode**: Active via **Google Gemini API** (`GEMINI_API_KEY`) using model `gemini-flash-latest`.
