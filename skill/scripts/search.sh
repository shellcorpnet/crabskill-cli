#!/bin/bash
# Search CrabSkill marketplace
# Usage: search.sh "query" [category] [pricing_type]
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

QUERY="${1:?Usage: search.sh \"query\" [category] [pricing_type]}"
CATEGORY="$2"
PRICING="$3"

URL="$BASE/skills?q=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$QUERY'))")"
[ -n "$CATEGORY" ] && URL="$URL&category=$CATEGORY"
[ -n "$PRICING" ] && URL="$URL&pricing_type=$PRICING"

curl -sL "$URL" | json_pretty
