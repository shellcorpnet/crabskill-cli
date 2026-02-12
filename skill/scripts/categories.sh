#!/bin/bash
# List all categories
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

curl -sL "$BASE/categories" | json_pretty
