param(
    [string]$PROFILE,
    [string]$DBI_PULL,
    [string]$BRIDGE_PULL,
    [string]$BRIDGE_PUSH,
    [string]$MQTT_BROKER,
    [string]$MQTT_PORT,
    [string]$MQTT_TOPIC,
    [string]$MQTT_USER,
    [string]$MQTT_PASSWORD,
    [string]$PAYLOAD_MODE,
    [string]$ANCHOR
)

Write-Host "Starting project..."

# ---- DEFAULT ENV VARIABLES ----
$envDefaults = @{
    DBI_PULL       = "tcp://0.0.0.0:5556"
    BRIDGE_PULL    = "tcp://0.0.0.0:5555"
    BRIDGE_PUSH    = "tcp://localhost:5555"
    MQTT_BROKER    = "localhost"
    MQTT_PORT      = "1883"
    MQTT_TOPIC     = "robots/#"
    MQTT_USER      = ""
    MQTT_PASSWORD  = ""
    PAYLOAD_MODE   = "json"
    ANCHOR         = "CORNER"
    PROFILE        = "simulator"
}

# ---- OVERRIDE DEFAULTS WITH PARAMETERS ----
foreach ($key in $envDefaults.Keys) {
    $paramValue = Get-Variable -Name $key -ErrorAction SilentlyContinue
    if ($paramValue -and $paramValue.Value) {
        Set-Item -Path "Env:$key" -Value $paramValue.Value
    } elseif (-not ${env:$key}) {
        Set-Item -Path "Env:$key" -Value $envDefaults[$key]
    }
}

Write-Host "Profile selected: ${env:PROFILE}"

# ---- VENV ----
if (!(Test-Path ".venv")) {
    Write-Host "Creating virtual environment..."
    python -m venv .venv
}

Write-Host "Activating venv..."
. .\.venv\Scripts\Activate.ps1

Write-Host "Installing dependencies..."
pip install -r requirements.txt

# ---- SERVICES ----
Write-Host "Starting web..."
Start-Process python -ArgumentList "-m uvicorn app.main:app --host 0.0.0.0 --port 8000"

Write-Host "Starting DB interface..."
Start-Process python -ArgumentList "-m app.db_interface"

Write-Host "Starting bridge..."
Start-Process python -ArgumentList "-m workers.bridge"

if (${env:PROFILE} -eq "simulator") {
    Write-Host "Starting simulator..."
    Start-Process python -ArgumentList "-m workers.simulator"
}

if (${env:PROFILE} -eq "connector") {
    Write-Host "Starting connector..."
    Start-Process python -ArgumentList "-m workers.connector"
}

Write-Host "All services started."