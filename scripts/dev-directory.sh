#!/usr/bin/env bash
# Starts the development Active Directory (Samba AD DC) that lives with api-stockline and seeds its demo people.
# Then run the API with directory sign-in: STOCKLINE_DIRECTORY=1 npm run dev:api
set -euo pipefail

API_DIR="${STOCKLINE_API_DIR:-$(cd "$(dirname "$0")/../../api-stockline" && pwd)}"
exec bash "${API_DIR}/dev/directory/up.sh"
