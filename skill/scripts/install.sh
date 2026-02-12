#!/bin/bash
# Install a skill from CrabSkill marketplace
# Usage: install.sh <slug>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SLUG="${1:?Usage: install.sh <slug>}"
SKILLS_DIR="$HOME/.openclaw/workspace/skills"
INSTALL_DIR="$SKILLS_DIR/$SLUG"
LOCK_FILE="$SKILLS_DIR/.crabskill-lock.json"
TMP_DIR=$(mktemp -d)

echo "📦 Installing $SLUG..."

# Download
HTTP_CODE=$(curl -sL -o "$TMP_DIR/$SLUG.zip" -w "%{http_code}" \
  $(auth_header) "$BASE/skills/$SLUG/download")

if [ "$HTTP_CODE" != "200" ]; then
  echo "❌ Download failed (HTTP $HTTP_CODE)"
  cat "$TMP_DIR/$SLUG.zip" 2>/dev/null
  rm -rf "$TMP_DIR"
  exit 1
fi

# Extract
mkdir -p "$INSTALL_DIR"
unzip -qo "$TMP_DIR/$SLUG.zip" -d "$INSTALL_DIR"

# Validate
if [ ! -f "$INSTALL_DIR/SKILL.md" ]; then
  # Check if extracted into a subfolder
  SUBFOLDER=$(find "$INSTALL_DIR" -maxdepth 2 -name "SKILL.md" -print -quit)
  if [ -n "$SUBFOLDER" ]; then
    SUBDIR=$(dirname "$SUBFOLDER")
    mv "$SUBDIR"/* "$INSTALL_DIR/" 2>/dev/null
    mv "$SUBDIR"/.* "$INSTALL_DIR/" 2>/dev/null
    rmdir "$SUBDIR" 2>/dev/null
  else
    echo "⚠️  Warning: No SKILL.md found in package"
  fi
fi

# Get version info
VERSION=$(curl -sL "$BASE/skills/$SLUG" | python3 -c "import sys,json; print(json.load(sys.stdin).get('current_version','unknown'))" 2>/dev/null)

# Update lock file
if [ -f "$LOCK_FILE" ]; then
  python3 -c "
import json, sys
with open('$LOCK_FILE') as f: lock = json.load(f)
lock['$SLUG'] = {'version': '$VERSION', 'source': 'crabskill'}
with open('$LOCK_FILE', 'w') as f: json.dump(lock, f, indent=2)
" 2>/dev/null
else
  echo "{\"$SLUG\": {\"version\": \"$VERSION\", \"source\": \"crabskill\"}}" | python3 -m json.tool > "$LOCK_FILE"
fi

rm -rf "$TMP_DIR"
echo "✅ Installed $SLUG v$VERSION → $INSTALL_DIR"
