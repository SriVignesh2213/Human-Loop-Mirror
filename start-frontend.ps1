Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Habit Loop Mirror Frontend" -ForegroundColor Cyan
Write-Host " UI: http://localhost:5173" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

$TARGET_DIR = if (Test-Path (Join-Path $PSScriptRoot "frontend")) { Join-Path $PSScriptRoot "frontend" } else { $PSScriptRoot }
Set-Location -Path $TARGET_DIR

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

npm run dev
