import os
import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.eligibility import (
    CitizenProfile,
    evaluate_all_schemes,
    load_knowledge_base,
    DATA_DIR
)
from app.chat import ChatRequest, ChatResponse, generate_grounded_reply

# Load environment variables from backend/.env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8005")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

app = FastAPI(
    title="Jan Sahayak API",
    description="Backend API for Jan Sahayak: Voice-first citizen scheme & certificate assistant",
    version="0.2.0",
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if "*" not in ALLOWED_ORIGINS else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory simple rate limiter (60 requests per minute per IP)
RATE_LIMIT_WINDOW = 60  # seconds
RATE_LIMIT_MAX = 60     # max requests per window
client_request_history = defaultdict(list)

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    # Allow health check without rate limiting
    if request.url.path == "/api/health":
        return await call_next(request)

    client_ip = request.client.host if request.client else "127.0.0.1"
    now = time.time()
    
    # Filter out requests older than the window
    history = [t for t in client_request_history[client_ip] if now - t < RATE_LIMIT_WINDOW]
    client_request_history[client_ip] = history

    if len(history) >= RATE_LIMIT_MAX:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Too many requests. Please wait a moment before trying again."
        )

    client_request_history[client_ip].append(now)
    response = await call_next(request)
    return response

@app.get("/api/health", summary="Health Check")
def health_check():
    """Health check endpoint. Indicates if Gemini API is configured."""
    is_key_configured = bool(
        GEMINI_API_KEY
        and GEMINI_API_KEY.strip()
        and GEMINI_API_KEY.strip() != "your_gemini_api_key_here"
    )

    return {
        "status": "ok",
        "service": "Jan Sahayak Backend API",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gemini_configured": is_key_configured,
        "model": GEMINI_MODEL,
        "port": int(os.getenv("PORT", "8005")),
    }

@app.get("/api/services", summary="List All Services")
def get_services():
    """Returns the full catalogue of scholarships, certificates, and pensions."""
    kb = load_knowledge_base()
    return {
        "scholarships": kb.get("scholarships", []),
        "certificates": kb.get("certificates", []),
        "pensions": kb.get("pensions", [])
    }

@app.get("/api/helpline", summary="Human Fallback & Helplines")
def get_helpline():
    """Returns helpline numbers, government portals, and CSC locator info."""
    helpline_file = DATA_DIR / "helpline.json"
    if helpline_file.exists():
        with open(helpline_file, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"message": "Helpline information not available."}

@app.post("/api/eligibility", summary="Evaluate Scheme Eligibility")
def check_eligibility(profile: CitizenProfile, scheme_type: Optional[str] = None):
    """
    Evaluates citizen profile against all scheme rules using deterministic Python logic.
    Returns categorized groups: eligible, maybe (missing info), and not_eligible.
    """
    results = evaluate_all_schemes(profile, scheme_type=scheme_type)
    return {
        "profile": profile.model_dump(),
        "results": results,
        "total_eligible": len(results["eligible"]),
        "total_maybe": len(results["maybe"]),
        "total_not_eligible": len(results["not_eligible"]),
    }

@app.post("/api/chat", response_model=ChatResponse, summary="Grounded Multilingual Chat")
def chat(request: ChatRequest):
    """
    Multilingual conversational endpoint grounded in the knowledge base.
    Returns reply, updated citizen profile, suggested actions, and source citations.
    """
    return generate_grounded_reply(request)

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8005"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
