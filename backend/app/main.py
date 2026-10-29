import os
from datetime import datetime, timezone
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables from backend/.env if present
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

# Environment configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
ALLOWED_ORIGINS_RAW = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
ALLOWED_ORIGINS = [origin.strip() for origin in ALLOWED_ORIGINS_RAW.split(",") if origin.strip()]

app = FastAPI(
    title="Jan Sahayak API",
    description="Backend API for Jan Sahayak: Voice-first citizen scheme & certificate assistant",
    version="0.1.0",
)

# Configure CORS so the React frontend can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", summary="Health Check")
def health_check():
    """
    Health check endpoint.
    Returns the server status and indicates if the Gemini API key is configured.
    Never exposes the API key itself.
    """
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
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8005"))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
