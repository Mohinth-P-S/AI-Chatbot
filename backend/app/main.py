import os
import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Request, status, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.eligibility import (
    CitizenProfile,
    evaluate_all_schemes,
    load_knowledge_base,
    DATA_DIR
)
from app.chat import ChatRequest, ChatResponse, generate_grounded_reply
from app.scanner import ScanResponse, extract_document_data

# Load environment variables from backend/.env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8005")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

app = FastAPI(
    title="NaviGov API",
    description="Backend API for NaviGov: Navigate Government Schemes, Certificates & Scholarships",
    version="0.3.0",
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
        "service": "NaviGov Backend API",
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

@app.post("/api/scan", response_model=ScanResponse, summary="Scan Document Image")
async def scan_document(
    file: UploadFile = File(..., description="Uploaded document image (JPEG, PNG, WebP)"),
    document_type: str = Form("general", description="Hint for document type")
):
    """
    In-memory document scanning via Gemini Vision OCR.
    Enforces privacy by masking ID numbers (last 4 digits only)
    and discarding image bytes immediately from memory.
    """
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{file.content_type}'. Please upload a JPEG, PNG, or WebP image."
        )

    # Read image content in-memory (max 5 MB)
    image_bytes = await file.read()
    if len(image_bytes) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds the 5 MB limit. Please compress or resize the image."
        )

    if len(image_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty."
        )

    # Process in memory
    result = extract_document_data(
        image_bytes=image_bytes,
        mime_type=file.content_type,
        doc_type_hint=document_type
    )

    return result

# Serve static frontend build if present (for single-service deployment)
frontend_dist = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    from fastapi.staticfiles import StaticFiles
    from starlette.responses import FileResponse

    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="static-assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API endpoint not found")
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(frontend_dist / "index.html"))

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8005"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
