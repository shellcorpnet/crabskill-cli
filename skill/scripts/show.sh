#!/bin/bash
# Show skill details
# Usage: show.sh <slug>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SLUG="${1:?Usage: show.sh <slug>}"
curl -sL "$BASE/skills/$SLUG" | json_pretty
