# Jan Sahayak - Comprehensive End-to-End Testing Checklist

This checklist verifies all features, flows, APIs, and accessibility modes of the Jan Sahayak prototype.

---

### 1. Automated Backend Tests
Run the complete automated test suite (18 unit tests):
```powershell
cd d:\AntiGravity\backend
.\.venv\Scripts\pytest -v tests/
```
Expected: `18 passed in ~16s` covering:
- Health check endpoint (`/api/health`)
- Services catalog (`/api/services` with 16 scholarships, 5 certificates, 4 pensions)
- Helplines & CSC locator (`/api/helpline`)
- Deterministic eligibility engine rules (income limits, category restrictions, gender, education level)
- Grounded multilingual chat with citations in English, Tamil, and Hindi
- Document scanner in-memory parsing, ID masking (`XXXX-XXXX-1234`), MIME validation, and file size limits.

---

### 2. Manual User Journey Tests

#### Test 1: Language Selection & Audio Greeting
1. Open `http://localhost:5173` in Google Chrome.
2. Select **தமிழ் (Tamil)** -> Click **தொடரவும் (Continue)**.
3. **Verify**: App displays Tamil interface and speaks the welcoming greeting aloud.

#### Test 2: Grounded Multilingual Chat
1. In the chat box, type or speak:
   *"What is the benefit of Pudhumai Penn scheme?"* (or in Tamil: *"புதுமைப் பெண் திட்டம் பற்றி சொல்லுங்கள்"*).
2. Click **Send**.
3. **Verify**:
   - Response explains the ₹1,000/month benefit for girl students from government schools.
   - Response displays official link: `https://penkalvi.tn.gov.in` and `Last verified: 2026-10-29`.
   - The bubble displays a **"🔊 வாசிக்க / Read Aloud"** button.

#### Test 3: Guided Scholarship Finder
1. In the chat, click the quick action **"🎓 உதவித்தொகை தேடல் / Find Scholarships"**.
2. Answer the 7 questions:
   - State: **Tamil Nadu**
   - Gender: **Female**
   - Education: **Undergraduate**
   - Category: **BC**
   - Income: **Under ₹1.5 Lakhs**
   - Disability: **No**
   - Govt School: **Yes**
3. Click **"உதவித்தொகைகளைக் கண்டறி 🔍"**.
4. **Verify**:
   - Shows matched eligible schemes (**Moovalur Ramamirtham Ammaiyar Pudhumai Penn** and **TN BC/MBC Post-Matric Scholarship**).
   - Each card displays benefits, deadline, required documents preview, and official link.

#### Test 4: Interactive Document Checklist
1. Click **"📋 ஆவண சரிபார்ப்பு பட்டியல்"** on any scholarship card.
2. Tick off documents you have (e.g. Aadhaar Card, EMIS ID).
3. **Verify**:
   - The progress bar dynamically updates (e.g. *"2 of 5 documents ready (40%)"*).
   - Click **"🔊 பட்டியலை வாசிக்க"** to hear the audio summary of ready vs. missing documents.
   - When all documents are ticked, a celebration banner appears: *"🎉 You have all required documents! You are ready to apply."*

#### Test 5: Citizen Certificates & Welfare Pensions Guide
1. Click **"📜 சான்றிதழ்கள்"** or **"👴 ஓய்வூதியங்கள்"**.
2. **Verify**:
   - Lists 5 certificates (Income, Community, Nativity, Birth, Death) and 4 pensions (Old Age OAP, Destitute Widow DWP, Differently Abled DAP, Deserted Wives).
   - Explains the step-by-step application process (e-Sevai CAN ID -> VAO/RI field verification -> Tahsildar issuance).

#### Test 6: Document Scanner & Privacy Guard
1. Click **"📷 ஆவணம் ஸ்கேன் / Scan Document"**.
2. **Verify**: Privacy Consent Modal appears first.
3. Check the consent box and click **Proceed**.
4. Click **"📄 மாதிரி வருமானச் சான்றிதழ் டெமோ"** (or choose any local image).
5. **Verify**:
   - Extracted details appear in editable fields.
   - ID number is masked: `XXXX-XXXX-8921` (showing only the last 4 digits).
   - Click **"Confirm & Update Profile"** to save to session.

#### Test 7: Human Fallback & Official Helplines
1. Click **"📞 அதிகாரியுடன் பேச / Talk to a Human"**.
2. **Verify**:
   - Displays CM Helpline (1100), Elderline (14567), Women Helpline (181), e-Sevai (1800-425-1333).
   - Displays direct link to the Common Service Centre (CSC) locator.

#### Test 8: Accessibility Mode (WCAG AAA)
1. Click the **"A11y"** button in the header.
2. **Verify**:
   - Visual styling switches to extreme high-contrast (Black background `#000000`, Bright Yellow text `#FFFF00`).
   - Font size expands by 1.35x.
   - 4px yellow focus outlines appear when navigating with the keyboard (`Tab` key).

#### Test 9: Kiosk Demo Mode (?kiosk=1)
1. Open `http://localhost:5173/?kiosk=1`.
2. **Verify**:
   - Sticky top bar appears showing **"🖥️ Kiosk Demo Mode Active"** and a 60-second countdown.
   - Touching or moving the mouse resets the timer to 60s.
   - Leave idle for 60 seconds: session automatically resets, clears data, returns to Welcome screen, and announces the reset.
   - Clicking **"🔄 End Session Now"** resets immediately.
