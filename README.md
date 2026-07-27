# 🧪 Lab Sample Intake Portal

An AI-powered laboratory sample registration portal designed to streamline intake manifest creation. Users can register new batches of feed/analytical samples instantly using voice recordings, manifest sheets photos, or an interactive spreadsheet-style grid.

---

## ✨ Features

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
Ensure you have the following installed:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (running)
*   [Node.js](https://nodejs.org/) (v18 or newer)
*   [Python](https://www.python.org/) (v3.10 or newer)

### 2. Run the Application
1. Double-click the **`start.bat`** script in the project root folder.
2. The script will automatically:
    *   Start/create a PostgreSQL container on port `5433`.
    *   Launch the FastAPI backend service (`http://localhost:8000`).
    *   Launch the Next.js development server (`http://localhost:3000`).
3. Open your browser and navigate to: **`http://localhost:3000`**

### 3. API Key Configuration (Optional)
The system is configured to run in **Mock Mode** if no API key is present:
*   **Mock Mode (Default)**: You can upload dummy audio or image files, and the app will generate mock sample extractions so you can try all visual flows without paying for API calls.
*   **Production AI Mode**: To use real AI parsing, add your OpenAI API key to the `backend/.env` file:
    ```env
    OPENAI_API_KEY=sk-proj-...
    ```
    Then restart the backend service.

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
