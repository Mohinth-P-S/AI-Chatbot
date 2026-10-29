"""
Interactive helper to set the GEMINI_API_KEY in backend/.env easily.
"""
import os
import re
from pathlib import Path
import webbrowser

env_path = Path(__file__).resolve().parent / ".env"
example_path = Path(__file__).resolve().parent / ".env.example"

def setup_key():
    print("=" * 60)
    print("  JAN SAHAYAK - GEMINI API KEY SETUP HELPER")
    print("=" * 60)
    print("\nOpening Google AI Studio in your default browser...\n")
    try:
        webbrowser.open("https://aistudio.google.com/app/apikey")
    except Exception:
        pass

    print("Steps in your browser:")
    print("1. Click the blue 'Create API key' button.")
    print("2. Copy the key (it usually starts with 'AIzaSy...').")
    print("3. Come back to this window and paste it below.\n")

    key = input("Paste your Gemini API key here: ").strip()

    if not key or key == "your_gemini_api_key_here":
        print("\n[-] Error: No valid key entered. Please try again.")
        return

    # Create .env from .env.example if it doesn't exist
    if not env_path.exists() and example_path.exists():
        content = example_path.read_text(encoding="utf-8")
    elif env_path.exists():
        content = env_path.read_text(encoding="utf-8")
    else:
        content = "GEMINI_API_KEY=\nGEMINI_MODEL=gemini-3.8-flash\nALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173\nPORT=8005\n"

    # Replace GEMINI_API_KEY line
    if "GEMINI_API_KEY=" in content:
        content = re.sub(r"GEMINI_API_KEY=.*", f"GEMINI_API_KEY={key}", content)
    else:
        content = f"GEMINI_API_KEY={key}\n" + content

    # Ensure port 8005
    if "PORT=8000" in content:
        content = content.replace("PORT=8000", "PORT=8005")

    env_path.write_text(content, encoding="utf-8")
    print(f"\n[+] Successfully saved your API key to backend/.env!")
    print("[+] Now verifying your Gemini connection...\n")

    # Run verification
    from verify_gemini import verify_connection
    if verify_connection():
        print("\n[+] ALL SET! Your Gemini AI is ready to power Jan Sahayak!")
    else:
        print("\n[-] Verification failed. Please check if the key was copied correctly.")

if __name__ == "__main__":
    setup_key()
