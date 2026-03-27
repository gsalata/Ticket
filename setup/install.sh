#!/usr/bin/env bash
set -euo pipefail

python3 -m pip install -r requirements.txt
python3 backend/db.py --init

echo "Setup complete. Start API with: python3 -m backend.app"
