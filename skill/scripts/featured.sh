#!/bin/bash
# List featured skills
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

curl -sL "$BASE/featured" | json_pretty
