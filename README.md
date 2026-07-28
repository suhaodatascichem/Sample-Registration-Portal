# 🧪 Lab Sample Intake Portal

An AI-powered laboratory sample registration portal designed to streamline intake manifest creation. Users can register new batches of feed/analytical samples instantly using voice recordings, manifest sheets photos, or an interactive spreadsheet-style grid.

---

## ✨ Features

*   ✍️ **Text Intake (Primary Method)**: Type or paste sample descriptions, lab notes, or email requests directly into a large intake window. Supports AI parsing, count & ID range expansions (e.g., *"4 broiler grower feed samples... 1001 to 1004"*), and quick-load template presets.
*   🎙️ **Voice-to-Text Intake**: Record or upload audio instructions (e.g. *"Please register broiler chicken feed samples for Smith Farm. We need Total Amino Acids and NIR tests..."*). Powered by OpenAI Whisper and GPT-4o-mini structured JSON extraction.
*   📸 **Photo Scanner (OCR)**: Upload handwritten sheets, printed labels, or manifest lists to extract customers, descriptions, and requested tests automatically via LLM Vision.
*   📊 **Spreadsheet Grid UI**: A high-performance interactive grid (built on AG Grid) allowing manual additions, edits, mass deletions, and seamless Excel-to-grid copy-pasting.
*   🚦 **Real-time Validation Checks**: Validates customer fields, ensures descriptions are not empty, and enforces that at least one test is selected per sample before submission.
*   🖨️ **Printable Manifest Crate Tag**: Generates a standard shipping label with a custom QR code containing the JSON manifest payload, optimized for print layout so it can be taped onto shipping crates.
*   💾 **LIMS Integration Export**: Download a clean, standard CSV formatted specifically for importing directly into Laboratory Information Management Systems.

---

## 🛠️ Technology Stack

*   **Frontend**: Next.js 14 (App Router), React, Tailwind CSS, AG Grid, Lucide Icons, QRCode SVG.
*   **Backend**: FastAPI (Python), SQLModel (Pydantic + SQLAlchemy) for database models and validations.
*   **Database**: PostgreSQL 15 (Docker container).
*   **AI Integration**: OpenAI SDK (Whisper-1 transcription & GPT-4o-mini structured schemas).

---

## 🚀 Quick Start

### 1. Prerequisites
Ensure you have the following installed on your PC:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Must be running for database creation)
*   [Node.js](https://nodejs.org/) (v18 or newer - required for frontend Next.js dev server & npm)
*   [Python](https://www.python.org/) (v3.10 or newer - required for FastAPI backend)

### 2. Run the Application
1. Double-click the **`start.bat`** script in the project root folder.
2. The script is portable and self-healing. It will automatically:
    * Detect and configure Node.js and Python environments on any PC.
    * Create Python `.venv` and install `pip` & `npm` dependencies automatically if missing.
    * Start/create the PostgreSQL container (`lab-postgres`) on port `5433`.
    * Launch the FastAPI backend service (`http://localhost:8000`) and Next.js frontend dev server (`http://localhost:3000`) in side-by-side command windows.
3. Open your browser and navigate to: **`http://localhost:3000`**

### 3. Share & Cloud Deployment Options
* 🚀 **Instant 1-Click Demo Sharing (`share.bat`)**: Double-click `share.bat` to generate a free shareable HTTPS URL (`https://...loca.lt`) in 1 minute to show your boss or team.
* 🌐 **24/7 Cloud Deployment (Render.com)**: Refer to [deployment_guide.md](file:///c:/AI%20project/Sample%20Registration%20Portal/Sample-Registration-Portal/deployment_guide.md) for step-by-step instructions to deploy your frontend, backend, and PostgreSQL database to Render.com (No credit card required).

### 4. API Key Configuration
* **Mock Mode (Default)**: If no API key is present, mock extractions will run for testing.
* **Production Google Gemini Mode**: Add your Google Gemini API key to `backend/.env`:
    ```env
    GEMINI_API_KEY=AIzaSy...
    ```

---

## 📂 Project Structure

```text
├── backend/
│   ├── app/
│   │   ├── api/            # FastAPI Endpoint routes (batches, customers, AI)
│   │   ├── services/       # AI extraction, LIMS CSV generator
│   │   ├── database.py     # SQLModel connection
│   │   ├── models.py       # SQLModel database tables
│   │   └── schemas.py      # Pydantic schemas & normalization
│   ├── tests/              # Pytest files
│   └── requirements.txt    # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Pages (Dashboard, Review, Manifest printing)
│   │   ├── components/     # UI elements (AudioRecorder, PhotoScanner, SampleGrid)
│   │   └── utils/          # API helper clients
│   └── package.json        # Frontend dependencies
│
├── start.bat               # Windows all-in-one startup script
└── .gitignore              # Global git exclusions
```
