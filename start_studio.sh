#!/usr/bin/env bash
# ==============================================================================
# Aegis Atelier Studio Launcher
# ==============================================================================
set -e

PORT=${1:-8080}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

echo "✨ Starting Aegis Atelier Web Studio on http://localhost:${PORT}"
echo "🌟 Motive: तारों से नहीं, मोहब्बत से होती है।"

exec python3 "${DIR}/web/server.py" "${PORT}"
