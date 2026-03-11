#!/bin/bash
set -e

# ---- PARAMETERS ----
PROFILE="${PROFILE:-simulator}"
DBI_PULL="${DBI_PULL:-tcp://0.0.0.0:5556}"
BRIDGE_PULL="${BRIDGE_PULL:-tcp://0.0.0.0:5555}"
BRIDGE_PUSH="${BRIDGE_PUSH:-tcp://localhost:5555}"
MQTT_BROKER="${MQTT_BROKER:-localhost}"
MQTT_PORT="${MQTT_PORT:-1883}"
MQTT_TOPIC="${MQTT_TOPIC:-robots/#}"
MQTT_USER="${MQTT_USER:-}"
MQTT_PASSWORD="${MQTT_PASSWORD:-}"
PAYLOAD_MODE="${PAYLOAD_MODE:-json}"
ANCHOR="${ANCHOR:-CORNER}"
MAX_X="${MAX_X:-73}"
MAX_Y="${MAX_Y:-43.5}"
ANCHOR_X="${ANCHOR_X:-20}"
ANCHOR_Y="${ANCHOR_Y:-10}"
ANCHOR_THETA="${ANCHOR_THETA:-0}"

echo "Starting project..."
echo "Profile selected: $PROFILE"

# ---- GENERATE FRONTEND CONFIG ----
CONFIG_DIR="static"
CONFIG_PATH="$CONFIG_DIR/config.js"

mkdir -p "$CONFIG_DIR"

cat > "$CONFIG_PATH" <<EOF
window.APP_CONFIG = {
    MAX_X: $MAX_X,
    MAX_Y: $MAX_Y,
    ANCHOR_X: $ANCHOR_X,
    ANCHOR_Y: $ANCHOR_Y,
    ANCHOR_THETA: $ANCHOR_THETA
};
EOF

echo "Generated frontend config at $CONFIG_PATH"

# ---- VENV ----
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

echo "Activating venv..."
source .venv/bin/activate

echo "Installing dependencies..."
pip install -r requirements.txt

# ---- SERVICES ----
echo "Starting web..."
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &

echo "Starting DB interface..."
python3 -m app.db_interface &

echo "Starting bridge..."
python3 -m workers.bridge &

if [ "$PROFILE" = "simulator" ]; then
    echo "Starting simulator..."
    python3 -m workers.simulator &
fi

if [ "$PROFILE" = "connector" ]; then
    echo "Starting connector..."
    python3 -m workers.connector &
fi

echo "All services started."