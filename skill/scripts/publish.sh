#!/bin/bash
# Publish a skill to CrabSkill marketplace
# Usage: publish.sh /path/to/skill/folder
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"
require_auth

SKILL_PATH="${1:?Usage: publish.sh /path/to/skill/folder}"

# Resolve to absolute path
SKILL_PATH="$(cd "$SKILL_PATH" 2>/dev/null && pwd)"

if [ ! -d "$SKILL_PATH" ]; then
  echo "❌ Directory not found: $SKILL_PATH"
  exit 1
fi

if [ ! -f "$SKILL_PATH/SKILL.md" ]; then
  echo "❌ No SKILL.md found in $SKILL_PATH"
  exit 1
fi

if [ ! -f "$SKILL_PATH/skill.json" ]; then
  echo "❌ No skill.json found in $SKILL_PATH"
  echo "   Create one with: name, version, description, keywords, etc."
  exit 1
fi

# Read metadata from skill.json
NAME=$(python3 -c "import json; print(json.load(open('$SKILL_PATH/skill.json'))['name'])" 2>/dev/null)
VERSION=$(python3 -c "import json; print(json.load(open('$SKILL_PATH/skill.json'))['version'])" 2>/dev/null)

echo "📤 Publishing $NAME v$VERSION..."

# Create zip
TMP_DIR=$(mktemp -d)
ZIP_FILE="$TMP_DIR/${NAME:-skill}.zip"
(cd "$SKILL_PATH" && zip -r "$ZIP_FILE" . -x "*.git*" -x "node_modules/*" -x ".DS_Store")

# Upload
RESPONSE=$(curl -sL -X POST $(auth_header) \
  -F "package=@$ZIP_FILE" \
  -F "skill_json=$(cat "$SKILL_PATH/skill.json")" \
  "$BASE/agent/skills/publish")

rm -rf "$TMP_DIR"

echo "$RESPONSE" | json_pretty
