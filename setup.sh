#!/usr/bin/env bash
set -e

echo "Starting project..."

if [ ! -d ".venv" ]; then
  python -m venv .venv
fi

source .venv/bin/activate
pip install -r requirements.txt

uvicorn app.main:app --reload --port 8000 &
python -m workers.bridge &
python -m workers.simulator &
python -m app.db_interface &

echo "All services running"
wait