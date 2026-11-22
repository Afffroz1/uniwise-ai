@echo off
echo ========================================================
echo   UniWise AI - Unified Single Web Application
echo   AMU Student Services Agentic RAG
echo ========================================================
echo.
echo Launching UniWise AI on http://localhost:8000 ...
echo (Serving both Frontend Portal and Agentic Backend API)
echo.

cd /d %~dp0backend
python main.py
pause
