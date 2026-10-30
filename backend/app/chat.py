"""
Grounded Conversational AI Engine for NaviGov (Navigate Government Schemes).
Answers citizen inquiries strictly using the official knowledge base.
Clarifies doubts regarding government certificates, scholarships, pensions, and eligibility.
Extracts profile updates and provides multilingual replies in Tamil, Hindi, or English.
"""
import os
import json
import logging
import re
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from app.eligibility import CitizenProfile, load_knowledge_base, DATA_DIR

logger = logging.getLogger(__name__)

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000, description="Citizen message or question")
    language: str = Field(default="ta", description="Preferred language: 'ta' (Tamil), 'hi' (Hindi), or 'en' (English)")
    profile: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Current session profile")

class SourceCitation(BaseModel):
    name: str
    url: str
    last_verified: str

class ChatResponse(BaseModel):
    reply: str
    language: str
    updated_profile: Dict[str, Any]
    suggested_actions: List[str] = Field(default_factory=list)
    sources: List[SourceCitation] = Field(default_factory=list)
    human_fallback: bool = False

def find_relevant_knowledge(query: str, kb: Dict[str, List[Dict[str, Any]]]) -> List[Dict[str, Any]]:
    """
    Intelligent keyword and category matcher across schemes, certificates, and pensions.
    Extracts relevant context for Gemini to accurately resolve citizen doubts.
    """
    q_lower = query.lower()
    matches = []
    added_ids = set()

    def add_match(item: Dict[str, Any], item_type: str):
        item_id = item.get("id", item.get("name"))
        if item_id not in added_ids:
            added_ids.add(item_id)
            matches.append({"type": item_type, **item})

    # 1. Match Certificates
    is_asking_certificate = any(w in q_lower for w in [
        "cert", "சான்றிதழ்", "प्रमाण", "income", "வருமானம்", "आय",
        "community", "சாதி", "जाति", "caste", "nativity", "இருப்பிடம்", "निवास",
        "first graduate", "முதல் பட்டதாரி", "प्रथम स्नातक",
        "legal heir", "வாரிசு", "वारिस", "residence", "tnesevai", "e-sevai", "esevai",
        "document", "ஆவணம்", "दस्तावेज़", "apply", "விண்ணப்பிக்க", "आवेदन"
    ])

    for c in kb.get("certificates", []):
        c_id = c.get("id", "").lower()
        c_name = c.get("name", "").lower()
        if any(tok in q_lower for tok in [c_id, c_name] if tok) or \
           ("income" in q_lower and "income" in c_id) or \
           (any(w in q_lower for w in ["community", "caste", "சாதி", "जाति"]) and "community" in c_id) or \
           (any(w in q_lower for w in ["nativity", "residence", "இருப்பிடம்", "निवास"]) and "nativity" in c_id) or \
           (any(w in q_lower for w in ["first graduate", "graduate", "பட்டதாரி", "स्नातक"]) and "first-graduate" in c_id) or \
           (any(w in q_lower for w in ["legal heir", "heir", "வாரிசு", "वारिस"]) and "legal-heir" in c_id) or \
           is_asking_certificate:
            add_match(c, "certificate")

    # 2. Match Scholarships
    is_asking_scholarship = any(w in q_lower for w in [
        "scholarship", "உதவித்தொகை", "छात्रवृत्ति", "college", "கல்லூரி", "कॉलेज",
        "school", "பள்ளி", "स्कूल", "study", "படிப்பு", "पढ़ाई", "student", "மாணவர்", "छात्र",
        "degree", "diploma", "engineering", "b.sc", "b.tech", "fees", "கல்விக்கட்டணம்", "फीस",
        "pudhumai", "புதுமைப்பெண்", "pudhalvan", "புதல்வன்", "nmms", "pragati", "saksham"
    ])

    for s in kb.get("scholarships", []):
        s_id = s.get("id", "").lower()
        s_name = s.get("name", "").lower()
        name_tokens = [t for t in s_name.split() if len(t) > 3]

        if any(token in q_lower for token in name_tokens) or \
           s_id in q_lower or \
           ("pudhumai" in q_lower and "pudhumai" in s_id) or \
           ("pudhalvan" in q_lower and "pudhalvan" in s_id) or \
           (any(w in q_lower for w in ["girl", "female", "women", "பெண்", "மாணவி", "மகளிர்", "लड़की", "महिला"]) and (s["eligibility_rules"].get("gender") == "female" or "pudhumai" in s_id or "pragati" in s_id)) or \
           (any(w in q_lower for w in ["boy", "male", "ஆண்", "மாணவன்", "लड़का"]) and (s["eligibility_rules"].get("gender") == "male" or "pudhalvan" in s_id)) or \
           ("sc" in q_lower and "sc" in s_id) or \
           ("st" in q_lower and "st" in s_id) or \
           (any(w in q_lower for w in ["obc", "bc", "mbc"]) and ("obc" in s_id or "bc" in s_id or "mbc" in s_id)) or \
           (any(w in q_lower for w in ["disability", "pwd", "மாற்றுத்திறனாளி", "दिव्यांग"]) and ("disab" in s_id or "pwd" in s_id or "saksham" in s_id)) or \
           (is_asking_scholarship and ("pudhumai" in s_id or "pudhalvan" in s_id or "post-matric" in s_id or "central" in s_id)):
            add_match(s, "scholarship")

    # 3. Match Pensions
    for p in kb.get("pensions", []):
        p_id = p.get("id", "").lower()
        if any(term in q_lower for term in ["pension", "ஓய்வூதியம்", "पेंशन", "oap", "widow", "விதவை", "विधवा", "old age", "முதியோர்", "बुजुर्ग", "deserted", "கைவிடப்பட்ட"]) or \
           p_id in q_lower:
            add_match(p, "pension")

    # If no specific matches found, provide popular cornerstone schemes & certificates
    if not matches:
        for s in kb.get("scholarships", [])[:4]:
            add_match(s, "scholarship")
        for c in kb.get("certificates", [])[:3]:
            add_match(c, "certificate")
        for p in kb.get("pensions", [])[:2]:
            add_match(p, "pension")

    return matches[:10]

def build_gemini_prompt(user_message: str, language: str, context_items: List[Dict[str, Any]], current_profile: Dict[str, Any]) -> str:
    lang_names = {"ta": "Tamil (தமிழ்)", "hi": "Hindi (हिन्दी)", "en": "English"}
    target_lang = lang_names.get(language, "Tamil (தமிழ்)")

    context_json = json.dumps(context_items, indent=2, ensure_ascii=False)
    profile_json = json.dumps(current_profile, indent=2, ensure_ascii=False)

    return f"""You are 'NaviGov' (Navigate Government Schemes / அரசு திட்ட வழிகாட்டி / नेविगोव), an expert, kind, patient, and highly knowledgeable citizen scheme and certificate advisor.

YOUR MISSION:
Clarify citizen doubts regarding government certificates (Income, Community, Nativity, First Graduate, Legal Heir), scholarships (Post-Matric, Pre-Matric, Pudhumai Penn, Tamil Pudhalvan, Merit, PwD), welfare pensions, and eligibility criteria.

KNOWLEDGE BASE CONTEXT (USE THIS FACTUAL INFORMATION):
{context_json}

CURRENT CITIZEN PROFILE:
{profile_json}

CITIZEN QUESTION / DOUBT:
"{user_message}"

TARGET RESPONSE LANGUAGE: {target_lang}

CORE ADVISING GUIDELINES:
1. EXTREME POLITENESS & RESPECTFUL TONE (MANDATORY):
   - Always address the citizen with the highest degree of respect, humility, and warmth.
   - In Tamil: Greet with 'வணக்கம் அய்யா/அம்மா', address the user with respectful pronouns like 'தாங்கள்' / 'தங்களுக்கு' (NEVER use casual 'நீ' or 'உனக்கு'). Use courteous phrases like 'தங்களுக்கு உதவ நான் பெருமகிழ்ச்சி அடைகிறேன்' (It is my great pleasure to assist you), 'தயவுசெய்து' (please), 'நன்றி' (thank you), and conclude with 'தங்களுக்கு மேலும் ஏதேனும் சந்தேகம் இருந்தால் தயங்காமல் கேட்கலாம்' (please feel free to ask any further doubts).
   - In Hindi: Greet with 'सादर प्रणाम / नमस्कार', address the user with highest respect 'आप' / 'आपको' (NEVER use 'तुम' or 'तू'). Use polite phrases like 'मुझे आपकी सहायता करने में अत्यंत प्रसन्नता हो रही है', 'कृपया', 'धन्यवाद', and conclude with 'यदि आपके मन में कोई अन्य प्रश्न हो तो अवश्य पूछें'.
   - In English: Greet with warm, humble respect ('Warm greetings! It is my absolute pleasure to assist you'). Use courteous phrases ('Please note', 'Kindly visit', 'Thank you for asking, please feel free to reach out for any further clarification').
2. DIRECT & EMPOWERING ANSWER: Clarify the citizen's doubt clearly, thoroughly, and reassuringly.
3. ELIGIBILITY CLARITY: Explain clearly who is eligible (income ceiling, caste categories, age limits, school/college criteria).
4. MANDATORY DOCUMENTS: If answering about a certificate or scheme, list the specific documents needed (e.g. Aadhaar Card, Ration Card, Salary Slip / VAO report, Marksheet, Bonafide certificate).
5. HOW TO APPLY: Provide clear step-by-step application guidance (e.g., Apply online at TN e-Sevai / NSP portal or visit nearest Arasu e-Sevai / CSC Center). Mention the standard government service fee (e.g. ₹60) and processing time if applicable.
6. GROUNDING: Only quote official facts from the knowledge base context. If a user asks about something completely outside government schemes, politely state you specialize in government schemes, certificates, and pensions, and recommend checking with official portals or visiting e-Sevai.
7. PROFILE EXTRACTION: Detect any citizen attributes mentioned in the message (age, family_income [integer], gender ['male'/'female'], category ['SC'/'ST'/'OBC'/'BC'/'MBC'/'General'], education_level, studied_in_govt_school [true/false], marital_status) and output them in 'updated_profile_fields'.

OUTPUT FORMAT:
Respond STRICTLY with a valid JSON object matching this schema, without markdown code fences or backticks:
{{
  "reply": "Clear, friendly, step-by-step explanation in {target_lang}",
  "updated_profile_fields": {{}},
  "suggested_actions": ["check_eligibility", "documents_needed", "talk_to_human"],
  "sources": [
    {{"name": "Exact scheme or certificate name", "url": "https://...", "last_verified": "YYYY-MM-DD"}}
  ],
  "human_fallback_needed": false
}}
"""

def generate_grounded_reply(req: ChatRequest) -> ChatResponse:
    kb = load_knowledge_base()
    relevant_items = find_relevant_knowledge(req.message, kb)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()

    # Candidate models in preference order (fast, reliable, free-tier supported)
    configured_model = os.getenv("GEMINI_MODEL", "gemini-3.5-flash").strip()
    candidate_models = [configured_model]
    for fallback_m in ["gemini-3.5-flash", "gemini-3.5-flash-lite", "gemini-flash-latest"]:
        if fallback_m not in candidate_models:
            candidate_models.append(fallback_m)

    if api_key and api_key != "your_gemini_api_key_here":
        try:
            from google import genai
            from google.genai import types

            client = genai.Client(
                api_key=api_key,
                http_options=types.HttpOptions(timeout=15000)
            )
            prompt = build_gemini_prompt(req.message, req.language, relevant_items, req.profile or {})

            # Try candidate models
            for model_name in candidate_models:
                try:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            temperature=0.2,
                        )
                    )

                    result_text = response.text.strip()
                    # Strip any accidental markdown formatting
                    if result_text.startswith("```json"):
                        result_text = result_text[7:]
                    elif result_text.startswith("```"):
                        result_text = result_text[3:]
                    if result_text.endswith("```"):
                        result_text = result_text[:-3]

                    data = json.loads(result_text.strip())

                    # Merge updated profile
                    updated_profile = dict(req.profile or {})
                    if "updated_profile_fields" in data and isinstance(data["updated_profile_fields"], dict):
                        updated_profile.update(data["updated_profile_fields"])

                    sources = []
                    for s in data.get("sources", []):
                        if isinstance(s, dict) and s.get("name"):
                            sources.append(SourceCitation(
                                name=s.get("name", "Official Portal"),
                                url=s.get("url", "https://tnesevai.tn.gov.in"),
                                last_verified=s.get("last_verified", "2026-10-30")
                            ))

                    if not sources and relevant_items:
                        for item in relevant_items[:2]:
                            sources.append(SourceCitation(
                                name=item.get("name", "Official Scheme"),
                                url=item.get("source_url", "https://tnesevai.tn.gov.in"),
                                last_verified=item.get("last_verified", "2026-10-30")
                            ))

                    fallback_reply = (
                        "வணக்கம்! நான் நேவிகோவ். உங்கள் கேள்விகளுக்கு பதிலளிக்க தயாராக உள்ளேன்."
                        if req.language == "ta" else (
                            "नमस्ते! मैं नेविगोव हूँ। मैं आपके प्रश्नों का उत्तर देने के लिए तैयार हूँ।"
                            if req.language == "hi" else
                            "Hello! I am NaviGov. I am ready to help you navigate schemes and certificates."
                        )
                    )

                    return ChatResponse(
                        reply=data.get("reply", fallback_reply),
                        language=req.language,
                        updated_profile=updated_profile,
                        suggested_actions=data.get("suggested_actions", ["check_eligibility"]),
                        sources=sources,
                        human_fallback=data.get("human_fallback_needed", False)
                    )
                except Exception as model_err:
                    logger.info("Model %s attempt failed (%s), trying next candidate...", model_name, model_err)
                    continue

        except Exception as exc:
            logger.warning("Gemini API invocation failed (%s); using grounded deterministic fallback.", exc)

    # High-quality deterministic fallback when Gemini API key is missing or offline
    return generate_deterministic_fallback(req, relevant_items)

def generate_deterministic_fallback(req: ChatRequest, relevant_items: List[Dict[str, Any]]) -> ChatResponse:
    """Provides an accurate, well-structured answer directly from structured datasets if Gemini is offline."""
    lang = req.language
    sources = []

    for item in relevant_items[:2]:
        sources.append(SourceCitation(
            name=item.get("name", ""),
            url=item.get("source_url", "https://tnesevai.tn.gov.in"),
            last_verified=item.get("last_verified", "2026-10-30")
        ))

    first_item = relevant_items[0] if relevant_items else None

    if lang == "ta":
        if first_item:
            name = first_item.get("name")
            desc = first_item.get("short_description")
            benefits = first_item.get("benefits", "")
            docs = ", ".join(first_item.get("required_documents", [])[:4])
            portal = first_item.get("source_url", "https://tnesevai.tn.gov.in")

            reply = (
                f"வணக்கம் அய்யா/அம்மா! தங்களுக்கு உதவ நான் பெருமகிழ்ச்சி அடைகிறேன். **{name}** பற்றிய முழு விவரங்கள் பணிவுடன் கீழே சமர்ப்பிக்கப்பட்டுள்ளன:\n\n"
                f"📌 **விளக்கம்:** {desc}\n"
                f"💰 **பயன்கள் / சலுகை:** {benefits}\n"
                f"📄 **தேவையான முக்கிய ஆவணங்கள்:** {docs}\n"
                f"🌐 **விண்ணப்பிக்கும் முறை:** தயவுசெய்து தங்களின் அருகிலுள்ள அரசு இ-சேவை மையம் (e-Sevai/CSC) அல்லது அதிகாரப்பூர்வ இணையதளம் மூலம் விண்ணப்பிக்கலாம்: {portal}\n\n"
                f"தங்களுக்கு மேலும் ஏதேனும் விளக்கம் தேவைப்பட்டால் தயங்காமல் கேட்கலாம்."
            )
        else:
            reply = "வணக்கம் அய்யா/அம்மா! நான் நேவிகோவ் (NaviGov) அரசு திட்ட வழிகாட்டி. அரசு உதவித்தொகை, வருமானம்/சாதி சான்றிதழ்கள் மற்றும் ஓய்வூதியங்கள் குறித்து தங்களுக்கு உதவ நான் பணிவுடன் தயாராக உள்ளேன். தங்களின் கேள்விகளை தயவுசெய்து கேட்கலாம்."
    elif lang == "hi":
        if first_item:
            name = first_item.get("name")
            desc = first_item.get("short_description")
            benefits = first_item.get("benefits", "")
            docs = ", ".join(first_item.get("required_documents", [])[:4])
            portal = first_item.get("source_url", "https://tnesevai.tn.gov.in")

            reply = (
                f"सादर प्रणाम! आपकी सहायता करने में मुझे अत्यंत प्रसन्नता हो रही है। **{name}** की पूरी जानकारी सादर प्रस्तुत है:\n\n"
                f"📌 **विवरण:** {desc}\n"
                f"💰 **लाभ:** {benefits}\n"
                f"📄 **आवश्यक दस्तावेज़:** {docs}\n"
                f"🌐 **आवेदन प्रक्रिया:** कृपया निकटतम ई-सेवा (e-Sevai/CSC) केंद्र या आधिकारिक पोर्टल पर जाएं: {portal}\n\n"
                f"यदि आपके मन में कोई अन्य प्रश्न हो, तो कृपया बेझिझक पूछें।"
            )
        else:
            reply = "सादर प्रणाम! मैं नेविगोव (NaviGov) हूँ। छात्रवृत्ति, आय/जाति प्रमाण पत्र और पेंशन योजनाओं से जुड़े किसी भी प्रश्न के समाधान के लिए मैं सदैव तत्पर हूँ। कृपया अपना प्रश्न पूछें।"
    else:
        if first_item:
            name = first_item.get("name")
            desc = first_item.get("short_description")
            benefits = first_item.get("benefits", "")
            docs = ", ".join(first_item.get("required_documents", [])[:4])
            portal = first_item.get("source_url", "https://tnesevai.tn.gov.in")

            reply = (
                f"Warm greetings! It is my absolute pleasure to assist you. Here are the complete verified details for **{name}**:\n\n"
                f"📌 **Overview:** {desc}\n"
                f"💰 **Benefits:** {benefits}\n"
                f"📄 **Required Documents:** {docs}\n"
                f"🌐 **How to Apply:** Kindly apply at your nearest local e-Sevai / CSC Center or online via: {portal}\n\n"
                f"Please feel free to ask if you need any further clarification or assistance."
            )
        else:
            reply = "Warm greetings! I am NaviGov (Navigate Government Schemes). I would be honored to assist you with any questions or doubts about government certificates, scholarships, pensions, and eligibility criteria!"

    return ChatResponse(
        reply=reply,
        language=lang,
        updated_profile=req.profile or {},
        suggested_actions=["check_eligibility", "documents_needed"],
        sources=sources,
        human_fallback=False
    )
