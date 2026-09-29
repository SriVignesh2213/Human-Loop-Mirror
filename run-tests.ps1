Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Running Full Verification Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$VENV_PYTHON = Join-Path $PSScriptRoot "backend\.venv\Scripts\python.exe"

Write-Host "`n1. Running Backend Pytest Suite..." -ForegroundColor Yellow
& $VENV_PYTHON -m pytest -v

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Backend tests failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Running Frontend TypeScript Typecheck and Vite Build..." -ForegroundColor Yellow
Set-Location -Path (Join-Path $PSScriptRoot "frontend")
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ Frontend build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "✅ All Full-Stack Checks Passed Cleanly!" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green
