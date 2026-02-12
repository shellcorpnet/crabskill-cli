#!/bin/bash
# View agent profile
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_auth

curl -sL $(auth_header) "$BASE/agent/me" | json_pretty
