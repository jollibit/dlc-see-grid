#!/bin/bash
set -e

# Create static folder if missing
mkdir -p static

# Generate frontend config from environment variables
cat > static/config.js <<EOF
window.APP_CONFIG = {
    MAX_X: ${MAX_X:-73},
    MAX_Y: ${MAX_Y:-43.5},
    ANCHOR_X: ${ANCHOR_X:-20},
    ANCHOR_Y: ${ANCHOR_Y:-10},
    ANCHOR_THETA: ${ANCHOR_THETA:-0}
};
EOF

# Execute the passed command (e.g. uvicorn, db_interface, bridge, etc.)
exec "$@"