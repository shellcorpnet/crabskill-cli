#!/bin/bash
# Get skill recommendations based on context
# Usage: recommend.sh "context description" [platform]
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

CONTEXT="${1:?Usage: recommend.sh \"context\" [platform]}"
PLATFORM="$2"

URL="$BASE/recommend?context=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$CONTEXT'))")"
[ -n "$PLATFORM" ] && URL="$URL&platform=$PLATFORM"

curl -sL "$URL" | json_pretty
