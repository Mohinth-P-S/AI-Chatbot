# Jan Sahayak - System Architecture & Engineering Deep-Dive

---

## 1. Architectural Philosophy

Government welfare scheme delivery requires **zero-tolerance for misinformation**. If an AI model hallucinates an income cap or invents a non-existent deadline, an impoverished citizen loses access to critical funds.

To solve this, Jan Sahayak enforces a strict **bifurcated architecture**:

```
+-----------------------------------------------------------------------------------+
|                                  USER / CITIZEN                                   |
|                      (Voice Input, Touch Screen, Screen Reader)                   |
+-----------------------------------------------------------------------------------+
                                          │
                                          ▼
+-----------------------------------------------------------------------------------+
|                           FRONTEND LAYER (React + Vite)                           |
|  - Web Speech API (SpeechRecognition & SpeechSynthesis in ta-IN, hi-IN, en-IN)   |
|  - Accessibility Layer (High-Contrast Theme, 4px Focus Rings, ARIA live regions)  |
|  - Kiosk Session Controller (60s Inactivity Idle Watcher & Auto-Wipe)             |
+-----------------------------------------------------------------------------------+
                                          │  REST API (JSON over HTTPS)
                                          ▼
+-----------------------------------------------------------------------------------+
|                        APPLICATION LAYER (FastAPI Backend)                        |
|                                                                                   |
|  ┌─────────────────────────────────────┐   ┌───────────────────────────────────┐  |
|  │    DETERMINISTIC RULE ENGINE        │   │    GROUNDED AI EXPLANATION ENGINE │  |
|  │    (Plain Auditable Python)         │   │    (Google Gemini 3.8 Flash)      │  |
|  │  - Evaluates min/max age rules      │   │  - Strict system prompt grounding │  |
|  │  - Validates income ceilings        │   │  - No external knowledge allowed  │  |
|  │  - Matches categories (SC/ST/OBC)   │   │  - Multilingual natural synthesis │  |
|  │  - Outputs: Eligible/Maybe/Rejected │   │  - In-memory OCR & ID Masking     │  |
|  └──────────────────┬──────────────────┘   └─────────────────┬─────────────────┘  |
+─────────────────────┼────────────────────────────────────────┼────────────────────+
                      ▼                                        ▼
+-------------------------------------------+  +------------------------------------+
|         STRUCTURED KNOWLEDGE BASE         |  |         GOOGLE GEMINI API          |
|  - scholarships.json (16 verified schemes)│  |  - Secure Backend-Only Key         |
|  - certificates.json (5 verified certs)   │  |  - gemini-3.8-flash model          |
|  - pensions.json (4 verified pensions)    │  |  - 15-second network timeout       |
|  - helpline.json (Emergency & CSC info)   │  +------------------------------------+
+-------------------------------------------+
```

---

## 2. Component Breakdown

### A. The Deterministic Eligibility Engine (`backend/app/eligibility.py`)
- **Input**: `CitizenProfile` (Pydantic model containing `age`, `family_income`, `category`, `gender`, `is_disabled`, `education_level`, `state`, `studied_in_govt_school`, etc.).
- **Process**: Iterates across verified scheme rule sets without invoking any LLM.
- **Output**: Categorizes schemes into three mutually exclusive bins:
  1. `eligible`: Citizen satisfies 100% of required conditions.
  2. `maybe`: Citizen satisfies known rules, but required parameters (e.g., family income or caste certificate) were omitted.
  3. `not_eligible`: Citizen violates a hard criterion, returning human-readable legal reasons (e.g., *"Requires minimum age of 60 years; applicant is 55"*).
- **Auditability**: Covered by 8 comprehensive automated unit tests in `tests/test_eligibility.py`.

### B. The Grounded AI Explanation Engine (`backend/app/chat.py`)
- **Model**: `gemini-3.8-flash` via official `google-genai` SDK.
- **Strict Grounding**: The system prompt passes only the relevant JSON knowledge base records. The model is explicitly barred from using unverified internet knowledge.
- **Rule**: If a query is outside the knowledge base, the model is instructed to output a polite fallback message recommending the **"Talk to a human"** helpline button.
- **Safe Fallback**: If the Gemini API key is missing or offline, the backend automatically provides verified answers directly from the local JSON files.

### C. In-Memory Document Scanner & ID Masking (`backend/app/scanner.py`)
- **Privacy Protocol**:
  1. Citizen must explicitly check the privacy consent modal before upload.
  2. File stream is read directly into RAM (`await file.read()`). No temporary files are written to disk.
  3. `google.genai.types.Part.from_bytes` sends bytes to Gemini Vision for OCR.
  4. Extracted ID numbers (Aadhaar, Roll No) pass through `mask_id_number()`:
     $$\text{Full ID} \xrightarrow{\text{regex}} \text{XXXX-XXXX-} + \text{last 4 digits}$$
  5. Image bytes in memory are garbage-collected immediately.

### D. Multilingual Speech Pipeline (`frontend/src/utils/speech.js`)
- **Speech Recognition (STT)**:
  - Leverages Chromium native Web Speech API with BCP-47 locale tags: `ta-IN`, `hi-IN`, `en-IN`.
  - Captures interim speech events so users see live transcription feedback as they speak.
- **Speech Synthesis (TTS)**:
  - Cleans raw markdown, URLs, and emojis before feeding to `SpeechSynthesisUtterance`.
  - Dynamically probes `window.speechSynthesis.getVoices()` to verify native voice availability.
  - Surfaces a friendly diagnostic notice if the host OS lacks Indian language voice packs.

### E. Kiosk Session Manager (`frontend/src/components/KioskBar.jsx`)
- Activates when URL has `?kiosk=1`.
- Registers passive listeners on `pointerdown`, `keydown`, `touchstart`, and `scroll`.
- A 60-second idle countdown timer resets on every user touch.
- On timeout: wipes all session messages, purges in-memory profile data, returns to the Welcome Screen, and sounds an audible reset announcement.

---

## 3. Data Schema Standards

Every scheme in `data/scholarships.json`, `data/certificates.json`, and `data/pensions.json` conforms to this schema:

```json
{
  "id": "unique-kebab-id",
  "name": "Official Scheme Name",
  "level": "central | state",
  "state": "All | Tamil Nadu",
  "short_description": "Clear explanation in plain language",
  "benefits": "Exact monetary or fee grant amount",
  "eligibility_rules": {
    "min_age": 14,
    "max_age": 35,
    "max_family_income": 250000,
    "allowed_categories": ["SC"],
    "gender": "any | female | male",
    "requires_disability": false,
    "education_levels": ["Undergraduate", "Postgraduate"],
    "studied_in_govt_school": false
  },
  "required_documents": ["Aadhaar Card", "Income Certificate"],
  "how_to_apply": "Step by step portal instructions",
  "deadline": "Check portal or specific cycle",
  "source_url": "https://official.gov.in",
  "last_verified": "YYYY-MM-DD",
  "status": "verified | needs_verification"
}
```
