#!/usr/bin/env bash
set -e

echo "Starting project..."

# ---- CONFIG (mirrors docker env defaults) ----
export DBI_PULL=${DBI_PULL:-tcp://0.0.0.0:5556}
export BRIDGE_PULL=${BRIDGE_PULL:-tcp://0.0.0.0:5555}
export BRIDGE_PUSH=${BRIDGE_PUSH:-tcp://localhost:5555}

export MQTT_BROKER=${MQTT_BROKER:-localhost}
export MQTT_PORT=${MQTT_PORT:-1883}
export MQTT_TOPIC=${MQTT_TOPIC:-robots/#}
export MQTT_USER=${MQTT_USER:-}
export MQTT_PASSWORD=${MQTT_PASSWORD:-}
export PAYLOAD_MODE=${PAYLOAD_MODE:-json}
export ANCHOR=${ANCHOR:-CORNER}

PROFILE=${1:-simulator}   # default profile

# ---- VENV SETUP ----
if [ ! -d ".venv" ]; then
  echo "Creating virtual environment..."
  python3 -m venv .venv
fi

source .venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

# ---- START SERVICES ----

echo "Starting web service..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 &
WEB_PID=$!

echo "Starting DB interface..."
python -m app.db_interface &
DBI_PID=$!

echo "Starting bridge..."
python -m workers.bridge &
BRIDGE_PID=$!

# ---- PROFILE SERVICES ----

if [ "$PROFILE" = "simulator" ]; then
  echo "Starting simulator..."
  python -m workers.simulator &
  SIM_PID=$!
fi

if [ "$PROFILE" = "connector" ]; then
  echo "Starting connector..."
  python -m workers.connector &
  CONN_PID=$!
fi

echo "All services running"
echo "Press Ctrl+C to stop"

wait