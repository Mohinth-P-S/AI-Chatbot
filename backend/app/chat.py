"""
Grounded Conversational AI Engine for Jan Sahayak.
Answers citizen inquiries strictly using the official knowledge base.
Extracts profile updates and provides multilingual replies in Tamil, Hindi, or English.
"""
import os
import json
import logging
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
    """Heuristic keyword match across schemes and certificates to inject into prompt context."""
    q_lower = query.lower()
    matches = []

    # Check scholarships
    for s in kb.get("scholarships", []):
        name_tokens = s["name"].lower().split()
        if any(token in q_lower for token in name_tokens if len(token) > 3) or \
           s["id"] in q_lower or \
           ("pudhumai" in q_lower and "pudhumai" in s["id"]) or \
           ("pudhalvan" in q_lower and "pudhalvan" in s["id"]) or \
           ("sc" in q_lower and "sc" in s["id"]) or \
           ("st" in q_lower and "st" in s["id"]) or \
           ("obc" in q_lower and "obc" in s["id"]) or \
           ("disability" in q_lower or "pwd" in q_lower or "மாற்றுத்திறனாளி" in q_lower):
            matches.append({"type": "scholarship", **s})

    # Check certificates
    for c in kb.get("certificates", []):
        if any(term in q_lower for term in ["certificate", "சான்றிதழ்", "प्रमाण", "income", "community", "nativity", "residence", "birth", "death"]):
            matches.append({"type": "certificate", **c})

    # Check pensions
    for p in kb.get("pensions", []):
        if any(term in q_lower for term in ["pension", "ஓய்வூதியம்", "पेंशन", "oap", "widow", "disability", "deserted", "old age"]):
            matches.append({"type": "pension", **p})

    # If no specific keyword matched, include summary of key services
    if not matches:
        matches = kb.get("scholarships", [])[:5] + kb.get("certificates", [])[:3] + kb.get("pensions", [])[:2]

    return matches[:8]

def build_gemini_prompt(user_message: str, language: str, context_items: List[Dict[str, Any]], current_profile: Dict[str, Any]) -> str:
    lang_names = {"ta": "Tamil (தமிழ்)", "hi": "Hindi (हिन्दी)", "en": "English"}
    target_lang = lang_names.get(language, "Tamil (தமிழ்)")

    context_json = json.dumps(context_items, indent=2, ensure_ascii=False)
    profile_json = json.dumps(current_profile, indent=2, ensure_ascii=False)

    return f"""You are 'Jan Sahayak' (மக்கள் உதவியாளர் / जन सहायक), an empathetic, dignified, and helpful government scheme advisor for Indian citizens.

KNOWLEDGE BASE CONTEXT (ONLY USE THIS INFORMATION):
{context_json}

CURRENT CITIZEN PROFILE:
{profile_json}

USER'S MESSAGE:
"{user_message}"

TARGET RESPONSE LANGUAGE: {target_lang}

STRICT OPERATING RULES:
1. ONLY answer using facts from the KNOWLEDGE BASE CONTEXT provided above. NEVER invent an eligibility rule, amount, deadline, or URL.
2. If the user asks about something not in the knowledge base, respond in {target_lang} stating clearly that you do not have that specific information, and advise them to use the "Talk to a human" button or visit their local Arasu e-Sevai / Common Service Centre (CSC).
3. If an answer relates to a scheme or certificate, include the official source URL and last verified date in your explanation.
4. Keep explanations simple, reassuring, and easy to understand for rural citizens and senior citizens.
5. EXTRACT CITIZEN PROFILE ATTRIBUTES: Look for any user attributes mentioned (age, family_income in numbers, gender ['male'/'female'/'other'], category ['SC'/'ST'/'OBC'/'MBC'/'BC'/'General'/'Minority'], is_disabled [true/false], education_level, state, studied_in_govt_school [true/false], marital_status). Update the citizen profile.

OUTPUT FORMAT:
You MUST respond strictly with a valid JSON object in this exact schema, with no markdown code fences:
{{
  "reply": "Empathetic, clear answer in {target_lang}",
  "updated_profile_fields": {{}},
  "suggested_actions": ["check_eligibility", "view_documents", "talk_to_human"],
  "sources": [
    {{"name": "Scheme name", "url": "https://...", "last_verified": "YYYY-MM-DD"}}
  ],
  "human_fallback_needed": false
}}
"""

def generate_grounded_reply(req: ChatRequest) -> ChatResponse:
    kb = load_knowledge_base()
    relevant_items = find_relevant_knowledge(req.message, kb)
    api_key = os.getenv("GEMINI_API_KEY", "").strip()
    model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

    # If Gemini API key is configured and not the default placeholder
    if api_key and api_key != "your_gemini_api_key_here":
        try:
            from google import genai
            from google.genai.types import GenerateContentConfig

            client = genai.Client(api_key=api_key)
            prompt = build_gemini_prompt(req.message, req.language, relevant_items, req.profile or {})

            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
                config=GenerateContentConfig(
                    response_mime_type="application/json",
                    temperature=0.2,
                )
            )

            result_text = response.text.strip()
            # Clean possible markdown formatting if present
            if result_text.startswith("```json"):
                result_text = result_text[7:]
            if result_text.endswith("```"):
                result_text = result_text[:-3]

            data = json.loads(result_text.strip())

            # Merge updated profile
            updated_profile = dict(req.profile or {})
            if "updated_profile_fields" in data and isinstance(data["updated_profile_fields"], dict):
                updated_profile.update(data["updated_profile_fields"])

            sources = [
                SourceCitation(
                    name=s.get("name", "Official Scheme"),
                    url=s.get("url", "https://scholarships.gov.in"),
                    last_verified=s.get("last_verified", "2026-10-29")
                )
                for s in data.get("sources", [])
            ]

            return ChatResponse(
                reply=data.get("reply", "வணக்கம். நான் உங்களுக்கு எவ்வாறு உதவ முடியும்?"),
                language=req.language,
                updated_profile=updated_profile,
                suggested_actions=data.get("suggested_actions", ["check_eligibility"]),
                sources=sources,
                human_fallback=data.get("human_fallback_needed", False)
            )

        except Exception as exc:
            logger.warning("Gemini API call failed (%s); using grounded deterministic fallback.", exc)

    # Deterministic fallback when Gemini API key is missing or offline
    return generate_deterministic_fallback(req, relevant_items)

def generate_deterministic_fallback(req: ChatRequest, relevant_items: List[Dict[str, Any]]) -> ChatResponse:
    """Provides a safe, verified answer directly from the local JSON files if Gemini is unavailable."""
    lang = req.language
    sources = []

    for item in relevant_items[:2]:
        sources.append(SourceCitation(
            name=item.get("name", ""),
            url=item.get("source_url", "https://tnesevai.tn.gov.in"),
            last_verified=item.get("last_verified", "2026-10-29")
        ))

    first_item = relevant_items[0] if relevant_items else None

    if lang == "ta":
        if first_item:
            reply = f"வணக்கம்! '{first_item.get('name')}' பற்றிய தகவல்கள் இதோ: {first_item.get('short_description')} பயன்கள்: {first_item.get('benefits')}. அதிகாரப்பூர்வ இணையதளம்: {first_item.get('source_url')} (சரிபார்க்கப்பட்ட தேதி: {first_item.get('last_verified')})."
        else:
            reply = "வணக்கம்! நான் ஜன சஹாயக். உதவித்தொகை, சான்றிதழ்கள் மற்றும் ஓய்வூதியங்கள் பற்றி என்னிடம் கேளுங்கள். மேலும் விவரங்களுக்கு 'அதிகாரியுடன் பேசுங்கள்' பொத்தானை அழுத்தலாம்."
    elif lang == "hi":
        if first_item:
            reply = f"नमस्ते! '{first_item.get('name')}' की जानकारी: {first_item.get('short_description')} लाभ: {first_item.get('benefits')}. आधिकारिक पोर्टल: {first_item.get('source_url')} (सत्यापित: {first_item.get('last_verified')})."
        else:
            reply = "नमस्ते! मैं जन सहायक हूँ। छात्रवृत्ति, प्रमाण पत्र और पेंशन के बारे में आप मुझसे पूछ सकते हैं।"
    else:
        if first_item:
            reply = f"Hello! Here is the information on '{first_item.get('name')}': {first_item.get('short_description')} Benefits: {first_item.get('benefits')}. Official Portal: {first_item.get('source_url')} (Verified: {first_item.get('last_verified')})."
        else:
            reply = "Hello! I am Jan Sahayak. You can ask me about scholarships, certificates, and welfare pensions. For human assistance, please select 'Talk to a human'."

    return ChatResponse(
        reply=reply,
        language=lang,
        updated_profile=req.profile or {},
        suggested_actions=["check_eligibility", "documents_needed"],
        sources=sources,
        human_fallback=False
    )
