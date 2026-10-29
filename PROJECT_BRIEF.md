You are my senior full-stack engineer and my teacher. We are building a working, deployed PROTOTYPE of "Jan Sahayak", a voice-first AI assistant that helps Indian citizens find and apply for government certificates, pensions and scholarships. I am a complete beginner at web development, AI APIs and deployment. Explain everything in simple language, never assume I know a term, and tell me exactly what I must do by hand (accounts, keys, clicks).

==================== 0. HOW WE WORK ====================
- FIRST ACTION: save this entire brief as PROJECT_BRIEF.md in the project root so you never lose context. Re-read it at the start of every phase.
- Work in the numbered PHASES below. After each phase STOP and give me a short report: (a) what you built, (b) the exact commands to run it, (c) what I should see when it works, (d) a test I can do myself, (e) what is next. Then wait for me to say "continue".
- Before each phase, show a short plan. If something needs my action (creating an account, a key, a click), list it as "ACTION FOR YOU" with numbered steps, and wait.
- SECRETS: never ask me to paste an API key into chat. Create a .env.example file, tell me to copy it to .env myself and paste the key there. .env must be in .gitignore before the first git commit. Never print keys in logs or code.
- Keep code simple, readable and commented. No unnecessary libraries. Use Git: commit after every phase with a clear message.
- If a step fails, read the error, fix it, and explain what went wrong in one or two sentences. Do not leave broken code.
- Check the CURRENT official docs before using any library or API (the Gemini API, Render, Vercel, Web Speech API). Do not rely on memory for model names, versions or settings.

==================== 1. THE PRODUCT ====================
Problem: rural people, senior citizens, visually impaired people and first-generation students lose hours in queues and cannot find or navigate government services online. They face language barriers, low digital literacy, poor accessibility, and do not know which scholarships they qualify for.

Prototype goal: a web app where a user speaks or types in Tamil, Hindi or English (design it so more languages can be added by changing a config file) and can:
  1. Chat with an assistant about certificates, pensions and scholarships.
  2. Find every scholarship they are eligible for, using a guided one-question-at-a-time flow.
  3. Get step-by-step guidance for certificates and pensions: documents needed, process, official link.
  4. Use a document checklist (tick the documents they already have).
  5. Scan a sample document (marksheet or income certificate) and have the details extracted, then confirmed by the user.
  6. Use an accessibility mode for visually impaired users: audio-first, auto read-aloud, large high-contrast text, full keyboard use, screen-reader labels.
  7. Press "Talk to a human" when the assistant is unsure, and get official helpline or Common Service Centre information.
  8. Run in "kiosk demo mode" (open the site with ?kiosk=1): fullscreen-style layout, giant buttons, and the session auto-resets after 60 seconds of inactivity.
Scope: central schemes plus Tamil Nadu state schemes. Make "state" a data field so other states can be added later. Default language: Tamil, with English and Hindi available.

OUT OF SCOPE (do NOT build, but mention in the README roadmap): real DigiLocker, National Scholarship Portal or e-District API integration, Aadhaar authentication, real application submission, SMS, kiosk hardware, all 22 languages. The assistant GUIDES the user and links to the official portal; it does not submit anything.

==================== 2. TECH STACK (use exactly this) ====================
- Backend: Python + FastAPI, run with uvicorn. Use pydantic models. Store data in JSON files and SQLite only if truly needed.
- Frontend: React + Vite (plain JavaScript), simple CSS (no heavy UI framework). Mobile-first and responsive.
- AI: Google Gemini API, called ONLY from the backend (the key never reaches the browser). Check the current Gemini docs and use the current recommended fast/cheap model by default, with the model name in an environment variable so I can change it. Use it for: (a) turning the user's message into structured profile fields, (b) answering questions grounded only in our knowledge base, (c) translating/explaining in the user's language, (d) reading document images (OCR) and returning JSON.
- Voice: the browser Web Speech API (speech recognition + speech synthesis) using language codes ta-IN, hi-IN, en-IN. Voice recognition mainly works in Chrome. If the device has no voice for the chosen language, show a clear friendly notice instead of failing silently.
- Deployment: backend on Render (web service), frontend on Vercel, code on GitHub.

==================== 3. KNOWLEDGE BASE AND ELIGIBILITY (critical for accuracy) ====================
- Create data files: scholarships.json, certificates.json, pensions.json.
- Every entry must have: id, name, level (central/state), state, short description, benefits, eligibility rules as structured fields (min_age, max_age, max_family_income, allowed_categories, gender, requires_disability, education_levels, etc.), required_documents, how_to_apply, deadline (or "check portal"), source_url, last_verified date, and status ("verified" or "needs_verification").
- Use your browser tool to research OFFICIAL government sources only (for example scholarships.gov.in and Tamil Nadu government and e-District portals). Cover about 15 scholarships (include central scholarships for SC/ST/OBC/minority/merit students, scholarships for students with disabilities, and Tamil Nadu schemes), 5 certificates (income, community, nativity/residence, birth, death) and 4 pensions (old-age, widow, disability, plus the Tamil Nadu equivalents). NEVER invent a rule, amount, deadline or URL. If you cannot confirm something from an official source, set status to "needs_verification" and say so in your phase report so I can check it.
- Eligibility is decided by plain Python code over the structured rules, NOT by the AI model. The AI only collects information and explains the result. The function returns three groups: eligible, maybe (some information missing) and not eligible with the reason. Write automated tests (pytest) for it.
- The chatbot may only answer scheme questions from these files. If the answer is not in them, it must say it does not know, and show the "Talk to a human" option. Always show the source link and last_verified date with scheme answers.

==================== 4. BACKEND API ====================
Build these endpoints with input validation, CORS limited to an environment-variable list of allowed frontend URLs, and simple rate limiting:
  GET  /api/health
  GET  /api/services  (lists certificates and pensions)
  POST /api/chat  (message, language, session profile -> reply, updated profile, suggested next action)
  POST /api/eligibility  (profile -> eligible / maybe / not eligible groups)
  POST /api/scan  (image upload + document type -> extracted fields as JSON with a confidence note)
  GET  /api/helpline  (human-fallback information from a config file)
Handle Gemini errors and rate limits (HTTP 429) with a friendly message in the user's language and a retry suggestion. Add timeouts.

==================== 5. FRONTEND SCREENS ====================
  1. Welcome and language screen: big language buttons; the app speaks a greeting in the chosen language.
  2. Main chat screen: large microphone button, text box, message bubbles, per-message "read aloud" button, a speaker on/off toggle, and quick-action buttons (Find scholarships / Certificates / Pensions / Scan document / Talk to a human).
  3. Scholarship finder: guided one-question-at-a-time flow (age, course/class, family income, category, gender, disability, state), each question spoken aloud and answerable by voice or buttons. Results as cards: name, benefit, deadline, documents, official link, "read aloud".
  4. Certificate and pension guide pages with a document checklist.
  5. Document scan screen: camera or file upload, a CONSENT message first, extracted fields shown for the user to confirm or correct. Mask any ID number except the last 4 digits. Do not save uploaded images (process in memory and discard).
  6. Accessibility mode toggle: large text, high contrast, auto read-aloud of every reply, full keyboard navigation, visible focus outlines, ARIA labels, skip links, correct heading order. Remember the choice.
  7. A permanent footer: "Prototype. Information may be outdated; always confirm on the official website."
Design: calm, dignified and clear, large touch targets, minimal text, icons plus words. Use the frontend-design skill if available.

==================== 6. SECURITY AND PRIVACY ====================
Explicit consent before scanning; no storing of personal data beyond the session; do not log personal data or full ID numbers; use only dummy documents when testing (I will never upload a real Aadhaar card); validate file type and size on upload; no secrets in the frontend or in Git. Clear all session data on kiosk reset.

==================== 7. PHASES ====================
PHASE 0  Check my machine (Python, Node, Git versions; tell me what to install if missing). Create the folder structure (backend/, frontend/, data/, docs/), run git init, write .gitignore, save PROJECT_BRIEF.md, and write an implementation plan for me to review.
PHASE 1  Backend skeleton with /api/health. ACTION FOR YOU: guide me step by step to create my Gemini API key and put it in backend/.env. Then write a tiny script that proves the Gemini connection works.
PHASE 2  Research and build the data files, the eligibility engine and its tests. Report which entries are "needs_verification".
PHASE 3  The /api/chat, /api/eligibility and /api/helpline endpoints, grounded in the knowledge base. Test with sample conversations in English, Tamil and Hindi and show me the results.
PHASE 4  Frontend shell: language screen, chat screen, accessibility mode, connected to the backend. Run both servers locally and test in the browser.
PHASE 5  Voice: speech-to-text and text-to-speech, language switching, auto read-aloud, graceful fallbacks.
PHASE 6  Guided scholarship finder, certificate and pension guides, document checklist.
PHASE 7  /api/scan and the scan screen with consent, confirmation and masking.
PHASE 8  Human fallback, kiosk demo mode (?kiosk=1 with 60-second auto reset).
PHASE 9  Full testing: use your browser tool to click through every flow on desktop and mobile size, run the backend tests, check accessibility (keyboard-only use, contrast), and fix every bug. Give me a final test checklist I can repeat.
PHASE 10 Deployment. ACTION FOR YOU at each step with exact clicks: push to GitHub; deploy the backend on Render (build and start commands, environment variables GEMINI_API_KEY, GEMINI_MODEL and ALLOWED_ORIGINS); deploy the frontend on Vercel (environment variable for the backend URL); update the allowed origins; run a smoke test on the live URLs. Explain that free tiers can be slow on the first request after idle time, and add a loading message in the UI for that.
PHASE 11 Documentation: README (what it is, how to run locally, how to deploy, environment variables, how to add a new scheme, language or state), a 3-minute demo script for judges, an architecture diagram, a "known limitations" section, and the roadmap from this prototype to the full product (DigiLocker and portal integrations, all 22 languages, kiosk hardware).

Begin now with PHASE 0 only.
