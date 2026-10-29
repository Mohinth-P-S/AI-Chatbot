# Jan Sahayak (जन सहायक / जन सहाय्यक / மக்கள் உதவியாளர்)
## Architecture & Implementation Plan

### 1. Project Overview & Vision
Jan Sahayak is a voice-first, bilingual/multilingual AI assistant designed to bridge the digital and literacy divide for Indian citizens seeking access to central and Tamil Nadu state government schemes (scholarships, certificates, and welfare pensions). 

The assistant provides:
- Voice & text interaction in Tamil (`ta-IN`), Hindi (`hi-IN`), and English (`en-IN`).
- Deterministic, rule-based scheme eligibility engine (100% auditable Python code, not hallucinatory LLM output).
- Grounded AI explanations using the Gemini API strictly constrained to official knowledge bases.
- Guided scholarship finder with one-question-at-a-time voice flow.
- Certificate & pension guidance with interactive document checklists.
- Document scanning with explicit user consent, client/in-memory processing, and Aadhaar/ID number masking (last 4 digits only).
- Accessibility mode (large high-contrast text, auto read-aloud, keyboard navigation, screen-reader friendly).
- Kiosk demo mode (`?kiosk=1`) with high-contrast big buttons and 60-second inactivity auto-reset.
- Safe human fallback ("Talk to a human") providing official helplines and Common Service Centre (CSC) details.

---

### 2. High-Level Architecture
```
+-------------------------------------------------------------+
|                      Browser / Client                       |
|   React + Vite (Single Page App, Mobile-First, Vanilla CSS) |
|   - Web Speech API (SpeechRecognition & SpeechSynthesis)    |
|   - Accessibility Mode & Kiosk Auto-Reset Logic             |
+-------------------------------------------------------------+
                              |
                     REST API (JSON / CORS)
                              |
+-------------------------------------------------------------+
|                   Backend Service (FastAPI)                 |
|   - /api/health          (Health check & system info)       |
|   - /api/services        (Certificates & pensions list)     |
|   - /api/chat            (Conversational assistant)         |
|   - /api/eligibility     (Deterministic rule evaluator)     |
|   - /api/scan            (Consent-guarded OCR & extraction) |
|   - /api/helpline        (CSC & Helpline directory)         |
+-------------------------------------------------------------+
         |                                    |
+-------------------+              +----------------------+
|  Knowledge Base   |              |   Google Gemini API  |
|  (JSON on disk)   |              |   (Secure Backend-   |
|  - scholarships   |              |    only integration) |
|  - certificates   |              +----------------------+
|  - pensions       |
|  - helplines      |
+-------------------+
```

---

### 3. Tech Stack & Standards
- **Backend**: Python 3.14+, FastAPI, Uvicorn, Pydantic v2.
- **AI Integration**: Google GenAI SDK (`google-genai`), using fast & cost-efficient models (e.g., `gemini-2.5-flash` or configurable via env).
- **Frontend**: React 18+ via Vite (pure JavaScript, clean CSS variables, zero heavy bloated component libraries).
- **Voice**: Browser-native Web Speech API (`webkitSpeechRecognition` / `SpeechSynthesis`) with graceful degradation and language availability detection.
- **Data Storage**: High-accuracy structured JSON files in `data/` verified against official government portals (`scholarships.gov.in`, `tnesevai.tn.gov.in`, etc.).
- **Testing**: `pytest` for backend unit and eligibility rule tests.
- **Deployment**: Backend on Render (Web Service), Frontend on Vercel, Source control on GitHub.

---

### 4. Implementation Phases Roadmap

| Phase | Title | Key Deliverables |
|---|---|---|
| **Phase 0** | Setup & Machine Check | Toolchain verification, folder structure, `.gitignore`, brief persistence, implementation plan. |
| **Phase 1** | Backend Skeleton & Gemini Connection | FastAPI app, `/api/health`, `.env.example`, Gemini API key setup instructions, verification test script. |
| **Phase 2** | Knowledge Base & Eligibility Engine | `scholarships.json`, `certificates.json`, `pensions.json`, Python eligibility matching logic, pytest suite. |
| **Phase 3** | Grounded Backend APIs | `/api/chat` with strict grounding, `/api/eligibility`, `/api/helpline`, multilingual prompt tests. |
| **Phase 4** | Frontend Shell | React + Vite setup, responsive layout, language selection screen, chat screen, accessibility toggle. |
| **Phase 5** | Voice Integration | STT (`ta-IN`, `hi-IN`, `en-IN`), TTS auto-read, audio state management, fallbacks. |
| **Phase 6** | Guided Finder & Service Guides | Step-by-step scholarship questionnaire, certificate/pension guidance, document checklist. |
| **Phase 7** | Document Scanner & Privacy Guard | Scan UI with consent modal, in-memory OCR via Gemini Vision, Aadhaar masking (last 4 digits), confirmation form. |
| **Phase 8** | Human Fallback & Kiosk Mode | Helplines & CSC locator, `?kiosk=1` layout, 60-second idle auto-reset. |
| **Phase 9** | End-to-End Testing & Polish | Browser automation test runs, keyboard navigation audit, contrast audit, unit tests, bug fixes. |
| **Phase 10** | Cloud Deployment | GitHub repository push, Render backend deployment, Vercel frontend deployment, live smoke testing. |
| **Phase 11** | Documentation & Showcase | Comprehensive `README.md`, 3-minute judge demo script, architecture diagrams, roadmap. |
