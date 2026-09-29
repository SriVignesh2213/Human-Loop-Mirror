Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " Starting Habit Loop Mirror Frontend" -ForegroundColor Cyan
Write-Host " UI: http://localhost:5173" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Cyan

Set-Location -Path $PSScriptRoot

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

npm run dev
