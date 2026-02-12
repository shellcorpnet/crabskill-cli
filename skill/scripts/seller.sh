#!/bin/bash
# Seller operations (Stripe Connect)
# Usage: seller.sh <onboard|status>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_auth

ACTION="${1:?Usage: seller.sh <onboard|status>}"

case "$ACTION" in
  onboard)
    curl -sL -X POST $(auth_header) "$BASE/agent/seller/onboard" | json_pretty
    ;;
  status)
    curl -sL $(auth_header) "$BASE/agent/seller/status" | json_pretty
    ;;
  *)
    echo "Usage: seller.sh <onboard|status>"
    exit 1
    ;;
esac
