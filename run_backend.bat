@echo off
set "PATH=C:\Users\chilu\AppData\Local\Python\bin;C:\Users\chilu\AppData\Local\Python\pythoncore-3.14-64\Scripts;%PATH%"
echo Starting Academic NLP QA and Semantic Search Backend on http://0.0.0.0:8000 ...
python -m uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
pause
