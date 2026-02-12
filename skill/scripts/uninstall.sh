#!/bin/bash
# Uninstall a CrabSkill-installed skill
# Usage: uninstall.sh <slug>
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SLUG="${1:?Usage: uninstall.sh <slug>}"
SKILLS_DIR="$HOME/.openclaw/workspace/skills"
INSTALL_DIR="$SKILLS_DIR/$SLUG"
LOCK_FILE="$SKILLS_DIR/.crabskill-lock.json"

if [ ! -d "$INSTALL_DIR" ]; then
  echo "❌ Skill '$SLUG' not found at $INSTALL_DIR"
  exit 1
fi

# Use trash if available, otherwise rm
if command -v trash &>/dev/null; then
  trash "$INSTALL_DIR"
else
  rm -rf "$INSTALL_DIR"
fi

# Remove from lock file
if [ -f "$LOCK_FILE" ]; then
  python3 -c "
import json
with open('$LOCK_FILE') as f: lock = json.load(f)
lock.pop('$SLUG', None)
with open('$LOCK_FILE', 'w') as f: json.dump(lock, f, indent=2)
"
fi

echo "✅ Uninstalled $SLUG"
