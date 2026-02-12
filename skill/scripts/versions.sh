#!/bin/bash
# Show version history for a skill
# Usage: versions.sh <slug>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SLUG="${1:?Usage: versions.sh <slug>}"
curl -sL "$BASE/skills/$SLUG/versions" | json_pretty
