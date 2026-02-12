#!/bin/bash
# Purchase a paid skill
# Usage: purchase.sh <slug>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_auth

SLUG="${1:?Usage: purchase.sh <slug>}"

curl -sL -X POST $(auth_header) "$BASE/agent/skills/$SLUG/purchase" | json_pretty
