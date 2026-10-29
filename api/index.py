"""
Serverless function entrypoint for Vercel.
Exposes the main FastAPI application.
"""
import sys
from pathlib import Path

# Add project root and backend folder to sys.path
root_dir = Path(__file__).resolve().parent.parent
backend_dir = root_dir / "backend"

for p in (str(root_dir), str(backend_dir)):
    if p not in sys.path:
        sys.path.insert(0, p)

from backend.app.main import app
