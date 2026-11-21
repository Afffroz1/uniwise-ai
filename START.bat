@echo off
echo ========================================================
echo   UniWise AI - Agentic RAG for AMU Student Services
echo   MCA Mini Project - Afroz Alam (GR3328 / 25CAMSA170)
echo ========================================================
echo.

echo [1/2] Launching Backend Server (FastAPI on http://localhost:8000)...
start "UniWise Backend" cmd /k "cd /d %~dp0backend && python main.py"

echo Waiting 3 seconds for backend to initialize...
timeout /t 3 /nobreak >nul

echo [2/2] Launching Frontend Interface (Next.js on http://localhost:3000)...
start "UniWise Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo ========================================================
echo   Both services are now running!
echo   Open in Browser: http://localhost:3000
echo.
echo   Login Options:
echo   1. Student Login:
echo      Faculty No: 25CAMSA170   Password: password123
echo      (Clean academic services, profile, course advising)
echo.
echo   2. Admin Login:
echo      Faculty No: admin         Password: admin123
echo      (PDF Ingestion, Knowledge Base & Gemini AI Settings)
echo ========================================================
echo.
pause
