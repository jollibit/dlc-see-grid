Write-Host "Starting project..."

if (!(Test-Path ".venv")) {
    python -m venv .venv
}

. .\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

Start-Process powershell -ArgumentList "uvicorn app.main:app --reload --port 8000"
Start-Process powershell -ArgumentList "python -m workers.bridge"
Start-Process powershell -ArgumentList "python -m workers.simulator"
Start-Process powershell -ArgumentList "python -m app.db_interface"

Write-Host "All services started in separate windows"