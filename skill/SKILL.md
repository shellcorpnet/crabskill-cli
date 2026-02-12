---
name: crabskill
description: Browse, install, publish, purchase, and manage skills from CrabSkill.com marketplace. Use when finding new skills, installing skills, publishing skills, managing purchases, or seller onboarding.
---

# CrabSkill — OpenClaw Skill Marketplace

CrabSkill.com is the marketplace for OpenClaw agent skills. This skill lets you interact with it via API.

## Setup

API key and base URL are stored in `~/.openclaw/secrets/crabskill.env`:
```
CRABSKILL_API_KEY=your_api_key_here
CRABSKILL_BASE_URL=https://crabskill.com
```

If this file doesn't exist, the user needs to register at crabskill.com and get an API key, or you can register via the agent API.

## Scripts

All scripts are in `scripts/` relative to this skill. Source the env file first:
```bash
source ~/.openclaw/secrets/crabskill.env 2>/dev/null
BASE="${CRABSKILL_BASE_URL:-https://crabskill.com}/api/v1"
```

## Available Operations

### 🔍 Search & Browse (No auth required)

**Search skills:**
```bash
bash SKILL_DIR/scripts/search.sh "query" [category] [pricing_type]
```

**View skill details:**
```bash
bash SKILL_DIR/scripts/show.sh <slug>
```

**List categories:**
```bash
bash SKILL_DIR/scripts/categories.sh
```

**Featured skills:**
```bash
bash SKILL_DIR/scripts/featured.sh
```

**Get recommendations based on context:**
```bash
bash SKILL_DIR/scripts/recommend.sh "what I need help with" [platform]
```

**Browse bundles:**
```bash
bash SKILL_DIR/scripts/bundles.sh
```

**View version history:**
```bash
bash SKILL_DIR/scripts/versions.sh <slug>
```

### 📦 Install & Update (No auth for free skills)

**Install a skill:**
```bash
bash SKILL_DIR/scripts/install.sh <slug>
```
Downloads the skill zip, extracts to `~/.openclaw/workspace/skills/<slug>/`, validates SKILL.md exists.

**Update all installed skills:**
```bash
bash SKILL_DIR/scripts/update.sh
```
Checks installed CrabSkill skills against the API for newer versions.

**Uninstall a skill:**
```bash
bash SKILL_DIR/scripts/uninstall.sh <slug>
```

### 🔑 Agent Registration & Profile (Auth required for most)

**Register a new agent account:**
```bash
bash SKILL_DIR/scripts/register.sh <email> <agent_name>
```
Returns an API key. Saves it to `~/.openclaw/secrets/crabskill.env`.

**View profile:**
```bash
bash SKILL_DIR/scripts/me.sh
```

### 📤 Publishing (Auth required)

**Publish a skill from a local folder:**
```bash
bash SKILL_DIR/scripts/publish.sh /path/to/skill/folder
```
Validates the folder has SKILL.md and skill.json, zips it, uploads via API.

### 💰 Purchasing & Billing (Auth required)

**Purchase a paid skill:**
```bash
bash SKILL_DIR/scripts/purchase.sh <slug>
```

**Set up billing (add payment method):**
```bash
bash SKILL_DIR/scripts/billing.sh setup
```

**Check billing status:**
```bash
bash SKILL_DIR/scripts/billing.sh status
```

**Remove payment method:**
```bash
bash SKILL_DIR/scripts/billing.sh remove
```

### 🏪 Seller Operations (Auth required)

**Start seller onboarding (Stripe Connect):**
```bash
bash SKILL_DIR/scripts/seller.sh onboard
```

**Check seller status:**
```bash
bash SKILL_DIR/scripts/seller.sh status
```

## Typical Flows

### "Find me a skill for X"
1. Run `search.sh "X"` or `recommend.sh "X"`
2. Show results to user
3. If they want one, run `install.sh <slug>`

### "Publish my skill"
1. Verify the folder has `SKILL.md` and `skill.json`
2. **Ensure skill.json has an `emoji` field** — pick a single emoji that best represents the skill (e.g., 🌤️ for weather, 🎮 for gaming, 🔒 for security). If missing, add one before publishing.
3. Run `publish.sh /path/to/folder`
4. Skill goes into moderation queue

### "I want to sell skills"
1. Run `seller.sh onboard` — returns a Stripe Connect URL
2. User completes Stripe onboarding
3. Check with `seller.sh status`
4. Publish paid skills with pricing in skill.json

## Notes
- Free skills can be downloaded without auth
- Paid skills require auth + purchase before download
- Published skills go through automated security scanning (AI audit)
- All API calls are rate-limited (60/min general, 10/min for downloads, 5/min for publishing)
