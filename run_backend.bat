@echo off
call .venv\Scripts\activate.bat
echo Starting Academic NLP QA and Semantic Search Backend on http://127.0.0.1:8000 ...
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
pause
