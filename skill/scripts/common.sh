#!/bin/bash
# Common setup for all CrabSkill scripts
ENV_FILE="$HOME/.openclaw/secrets/crabskill.env"
[ -f "$ENV_FILE" ] && source "$ENV_FILE"
BASE="${CRABSKILL_BASE_URL:-https://crabskill.com}/api/v1"

auth_header() {
  if [ -n "$CRABSKILL_API_KEY" ]; then
    echo "-H" "Authorization: Bearer $CRABSKILL_API_KEY"
  fi
}

require_auth() {
  if [ -z "$CRABSKILL_API_KEY" ]; then
    echo "❌ No API key found. Register first: bash scripts/register.sh <email> <name>"
    echo "   Or set CRABSKILL_API_KEY in $ENV_FILE"
    exit 1
  fi
}

json_pretty() {
  python3 -m json.tool 2>/dev/null || cat
}
