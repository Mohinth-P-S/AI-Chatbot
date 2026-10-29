# 🎤 Jan Sahayak - 3-Minute Hackathon Demo Script for Judges

**Tagline**: *A voice-first, multilingual AI companion bridging India's digital and literacy divide for government scholarships, pensions, and certificates.*

---

### Timing Breakdown (3 Minutes Total)

```
0:00 - 0:35  |  The Human Problem & Hook
0:35 - 1:20  |  Voice-First Interaction & Tamil Demonstration
1:20 - 1:55  |  Deterministic Eligibility vs. AI Hallucination
1:55 - 2:30  |  Privacy-Preserving Document Scanner & ID Masking
2:30 - 3:00  |  Accessibility, Kiosk Demo Mode & The Vision
```

---

### [0:00 - 0:35] The Problem & Hook
> *"Judges, over 300 million Indian citizens—rural elders, first-generation college students, and visually impaired citizens—are eligible for life-changing welfare schemes. Yet billions of rupees in scholarships and pensions go unclaimed every year.*
> 
> *Why? Complicated portals in English, digital illiteracy, endless queues, and zero knowledge of eligibility criteria.*
>
> *Meet **Jan Sahayak (மக்கள் உதவியாளர்)**: a voice-first, empathetic AI assistant built for Bharat. A citizen simply speaks in Tamil, Hindi, or English, and Jan Sahayak guides them from eligibility to application without leaving their phone or village kiosk."*

---

### [0:35 - 1:20] Voice Interaction in Tamil (Live Demo)
> *(Open `http://localhost:5173` on screen)*
>
> *"Let's see it live. I select **Tamil (தமிழ்)**. The assistant immediately speaks a native greeting.*
>
> *(Click the large microphone icon and speak in Tamil)*:
> 🎙️ **"புதுமைப் பெண் திட்டத்திற்கு யார் தகுதியானவர்கள்?"**
> *(Who is eligible for the Pudhumai Penn scheme?)*
>
> *(Show Jan Sahayak's response)*:
> *"Notice what happened in real-time:
> 1. Web Speech STT captured my Tamil speech with live interim recognition.
> 2. The assistant replied in clear, spoken Tamil, citing the exact official portal: `penkalvi.tn.gov.in`.
> 3. It extracted my context—recognizing that this is for girl students from Tamil Nadu government schools receiving ₹1,000 every month."*

---

### [1:20 - 1:55] Deterministic Eligibility vs. Hallucination
> *"Here is our core engineering innovation: **We never allow an AI model to guess legal eligibility.** LLMs hallucinate rules, income caps, and deadlines.*
> 
> *(Click '🎓 உதவித்தொகை தேடல் / Find Scholarships')*
>
> *Jan Sahayak uses a **deterministic, rule-based Python engine** running against 100% verified government criteria.
> 
> Watch this 7-step guided questionnaire:
> - Gender: Female
> - College: Undergraduate
> - Category: BC
> - Income: Under ₹1.5 Lakhs
> - Govt School: Yes
>
> *(Click 'Find My Scholarships')*
> Boom! Our Python engine evaluated 25 scheme rules in 10 milliseconds and matched **Pudhumai Penn** and **TN BC/MBC Post-Matric Scholarship**.
> 
> If I click **'Document Checklist'**, it lets me tick off documents I have, gives a visual percentage tracker, and reads the missing documents aloud!"*

---

### [1:55 - 2:30] Privacy-Preserving Scanner & ID Masking
> *(Click '📷 ஆவணம் ஸ்கேன் / Scan Document')*
>
> *"What if a rural student has an income certificate or marksheet but cannot type the numbers?
> 
> First, our **Mandatory Privacy Guard** requires explicit consent.
> Second, our backend processes the image **strictly in-memory** and immediately destroys it. No citizen documents are ever saved to disk.
> 
> *(Click 'Test Sample Income Certificate')*
> 
> Gemini Vision OCR reads the document and automatically **masks all ID digits except the last 4**—turning sensitive numbers into `XXXX-XXXX-8921`. The student can review and confirm their details with one click."*

---

### [2:30 - 3:00] Accessibility, Kiosk Mode & Vision
> *(Click 'A11y' in the top header)*
>
> *"For elderly and visually impaired citizens, one click toggles our **WCAG AAA Accessibility Mode**: pure black background with bright yellow text, 1.35x typography, and full keyboard navigation.
>
> *(Switch to `?kiosk=1`)*
>
> *And for public village panchayat kiosks, our **Kiosk Mode** features a 60-second inactivity auto-reset that automatically wipes all session data when a user walks away.
>
> Today, Jan Sahayak covers central and Tamil Nadu schemes in 3 languages. Our roadmap integrates DigiLocker, WhatsApp Voice Bot, and all 22 Indian languages.
>
> Jan Sahayak makes governance accessible, dignified, and voice-first for every Indian. Thank you!"*
