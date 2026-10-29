"""
Verification script for Gemini API connectivity.
Reads the API key from backend/.env without printing it.
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from the backend folder
env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

api_key = os.getenv("GEMINI_API_KEY", "").strip()
model_name = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

def verify_connection():
    if not api_key or api_key == "your_gemini_api_key_here":
        print("[-] GEMINI_API_KEY is not set in backend/.env!")
        print("    Please follow the instructions in the Phase 1 guide to add your key.")
        return False

    print(f"[+] Found GEMINI_API_KEY (configured, length: {len(api_key)} chars).")
    print(f"[+] Connecting to Gemini API with model: {model_name}...")

    try:
        from google import genai

        # Initialize the official Google GenAI client
        client = genai.Client(api_key=api_key)

        # Make a minimal test call
        response = client.models.generate_content(
            model=model_name,
            contents="Say 'Jan Sahayak is ready to assist citizens!' in one short sentence.",
        )

        print("[+] SUCCESS: Gemini API responded!")
        print(f"[+] Response from {model_name}: {response.text.strip()}")
        return True

    except Exception as exc:
        print(f"[-] ERROR: Failed to connect to Gemini API: {exc}")
        print("    Check that your API key is active and has permissions enabled.")
        return False

if __name__ == "__main__":
    success = verify_connection()
    sys.exit(0 if success else 1)
