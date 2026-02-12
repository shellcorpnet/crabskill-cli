#!/bin/bash
# Manage billing/payment methods
# Usage: billing.sh <setup|status|remove>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_auth

ACTION="${1:?Usage: billing.sh <setup|status|remove>}"

case "$ACTION" in
  setup)
    curl -sL -X POST $(auth_header) "$BASE/agent/billing/setup" | json_pretty
    ;;
  status)
    curl -sL $(auth_header) "$BASE/agent/billing/status" | json_pretty
    ;;
  remove)
    curl -sL -X DELETE $(auth_header) "$BASE/agent/billing/card" | json_pretty
    ;;
  *)
    echo "Usage: billing.sh <setup|status|remove>"
    exit 1
    ;;
esac
