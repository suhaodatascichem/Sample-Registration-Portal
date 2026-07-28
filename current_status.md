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

---

## 🛰️ Git Repository Status

*   **Repository Location**: `d:\Data\AI-projects\sample-registration-portal`
*   **Ignored Files (via `.gitignore`)**:
    *   Python virtual environments (`backend/.venv/`, `backend/.pytest_cache/`, `*.pyc`)
    *   Sensitive credentials (`backend/.env`)
    *   Node/Next modules and caches (`frontend/node_modules/`, `frontend/.next/`)
*   **GitHub Remote**: `https://github.com/suhaodatascichem/Sample-Registration-Portal`
*   **Main Branch**: `main` (tracked with `origin/main`)

---

## 🏃 Run State

*   **Database**: PostgreSQL runs inside Docker container `lab-postgres` mapping container port `5432` to host port `5433` (as defined in `start.bat`).
*   **FastAPI Backend**: Runs on `http://localhost:8000`.
*   **Next.js Frontend**: Runs on `http://localhost:3000`.
*   **AI Mode**: Active in **Mock Mode** by default. Set `OPENAI_API_KEY` in `backend/.env` to switch to live OpenAI parsing.
