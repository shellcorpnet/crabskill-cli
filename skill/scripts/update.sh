#!/bin/bash
# Check and update all CrabSkill-installed skills
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/common.sh"

SKILLS_DIR="$HOME/.openclaw/workspace/skills"
LOCK_FILE="$SKILLS_DIR/.crabskill-lock.json"

if [ ! -f "$LOCK_FILE" ]; then
  echo "No CrabSkill-installed skills found."
  exit 0
fi

echo "🔄 Checking for updates..."

python3 -c "
import json, subprocess, sys

with open('$LOCK_FILE') as f:
    lock = json.load(f)

updates = []
for slug, info in lock.items():
    result = subprocess.run(['curl', '-sL', '$BASE/skills/' + slug],
                          capture_output=True, text=True)
    try:
        data = json.loads(result.stdout)
        remote_ver = data.get('current_version', '')
        local_ver = info.get('version', '')
        if remote_ver and remote_ver != local_ver:
            updates.append((slug, local_ver, remote_ver))
            print(f'  📦 {slug}: {local_ver} → {remote_ver}')
        else:
            print(f'  ✅ {slug}: {local_ver} (up to date)')
    except:
        print(f'  ⚠️  {slug}: could not check')

if not updates:
    print('\nAll skills up to date!')
else:
    print(f'\n{len(updates)} update(s) available.')
    print('Run install.sh <slug> to update individual skills.')
"
