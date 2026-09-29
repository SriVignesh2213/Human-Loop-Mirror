Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Habit Loop Mirror Backend" -ForegroundColor Cyan
Write-Host " Server: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host " Docs:   http://127.0.0.1:8000/docs" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$VENV_PYTHON = Join-Path $PSScriptRoot "backend\.venv\Scripts\python.exe"
$PYTHON_CMD = if (Test-Path $VENV_PYTHON) { $VENV_PYTHON } else { "python" }

$ROOT_DIR = $PSScriptRoot
$BACKEND_DIR = Join-Path $PSScriptRoot "backend"
$env:PYTHONPATH = "$ROOT_DIR;$BACKEND_DIR;$env:PYTHONPATH"

& $PYTHON_CMD -m uvicorn backend.app.main:app --reload --port 8000 --host 127.0.0.1
