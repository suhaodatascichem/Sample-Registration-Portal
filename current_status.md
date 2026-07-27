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

### ⚙️ 3. Next.js Build & Prerender Fix
*   **Issue**: The production build failed because `useSearchParams()` was used inside `/review` (a Next.js Client Component) without a `Suspense` boundary, causing a build-time bailout.
*   **Resolution**: Extracted the core review layout into a private sub-component (`ReviewAndConfirmContent`) and wrapped the exported `ReviewAndConfirm` page in a **React `<Suspense>` boundary** with a loading indicator fallback.
*   **Status**: `npm run build` now compiles and optimizes successfully without warnings.

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
