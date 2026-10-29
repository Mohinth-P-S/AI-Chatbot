@echo off
cd /d "%~dp0backend"
if exist ".venv\Scripts\python.exe" (
    .venv\Scripts\python.exe set_gemini_key.py
) else (
    python set_gemini_key.py
)
pause
