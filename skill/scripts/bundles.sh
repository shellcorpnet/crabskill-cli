#!/bin/bash
# List available skill bundles
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

curl -sL "$BASE/bundles" | json_pretty
