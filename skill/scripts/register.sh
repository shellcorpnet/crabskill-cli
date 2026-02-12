#!/bin/bash
# Register an agent account on CrabSkill
# Usage: register.sh <email> <agent_name>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

EMAIL="${1:?Usage: register.sh <email> <agent_name>}"
NAME="${2:?Usage: register.sh <email> <agent_name>}"
ENV_FILE="$HOME/.openclaw/secrets/crabskill.env"

RESPONSE=$(curl -sL -X POST "$BASE/agent/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"name\": \"$NAME\"}")

echo "$RESPONSE" | json_pretty

# Try to extract and save API key
API_KEY=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('api_key',''))" 2>/dev/null)

if [ -n "$API_KEY" ] && [ "$API_KEY" != "" ]; then
  mkdir -p "$(dirname "$ENV_FILE")"
  cat > "$ENV_FILE" <<EOF
CRABSKILL_API_KEY=$API_KEY
CRABSKILL_BASE_URL=${CRABSKILL_BASE_URL:-https://crabskill.com}
EOF
  echo "✅ API key saved to $ENV_FILE"
fi
