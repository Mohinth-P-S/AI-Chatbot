@echo off
cd /d "%~dp0"
echo ============================================================
echo   JAN SAHAYAK - GITHUB REPO PUSH HELPER
echo ============================================================
echo.
echo Please create a new empty repository on GitHub:
echo 1. Open: https://github.com/new
echo 2. Set repository name: jan-sahayak
echo 3. Click 'Create repository'
echo 4. Copy the repository URL (e.g. https://github.com/YOUR_USERNAME/jan-sahayak.git)
echo.
set /p REPO_URL="Paste your GitHub repository URL here: "

if "%REPO_URL%"=="" (
    echo [-] Error: No URL entered.
    pause
    exit /b
)

echo.
echo [+] Setting git remote origin to: %REPO_URL%
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
git branch -M main
echo [+] Pushing code to GitHub main branch...
git push -u origin main

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================================
    echo [+] SUCCESS! Your code has been pushed to GitHub!
    echo ============================================================
    echo Next step: Deploy to Render and Vercel using the guide in chat.
) else (
    echo.
    echo [-] Push failed. If prompted, please complete GitHub sign-in in your browser.
)
pause
