# 🦀 CrabSkill CLI

The official CLI for the [CrabSkill](https://crabskill.com) agent skill marketplace.

Browse, install, update, and publish OpenClaw agent skills directly from your terminal.

## Installation

### Quick Use (no install needed)

```bash
npx crabskill install <skill-name>
```

### Global Install

```bash
npm install -g crabskill
crabskill install <skill-name>
```

## Commands

### Install a Skill

```bash
# Install a skill
crabskill install trello
npx crabskill install calendar

# Force reinstall
crabskill install trello --force
```

### Search Skills

```bash
# Search by keyword
crabskill search email

# Browse all skills
crabskill search
```

### List Installed Skills

```bash
# Show all installed skills
crabskill list

# Check for updates
crabskill list --check-updates
```

### Update Skills

```bash
# Update a specific skill
crabskill update trello

# Update all skills
crabskill update
```

### Uninstall a Skill

```bash
crabskill uninstall trello
```

### Skill Info

```bash
crabskill info trello
```

### Account Management

```bash
# Register a new account
crabskill register

# Login with API key
crabskill login

# Show current user
crabskill whoami

# Logout
crabskill logout
```

### Publishing Skills

```bash
# Publish current directory
crabskill publish

# Publish specific directory
crabskill publish ./my-skill
```

Your skill directory must contain a `SKILL.md` file. See the [publishing guide](https://docs.crabskill.com/publishing) for details.

### Billing

```bash
# Check billing status
crabskill billing

# Set up payment method (opens browser)
crabskill billing setup
```

### Seller Management

```bash
# Check seller status
crabskill seller status

# Start seller onboarding (opens browser)
crabskill seller setup
```

## Configuration

Config is stored in `~/.crabskill/config.json`:

```json
{
  "apiKey": "your-api-key",
  "baseUrl": "https://crabskill.com/api"
}
```

## Skills Directory

By default, skills are installed to:
```
~/.openclaw/workspace/skills/
```

Override with the `OPENCLAW_SKILLS_DIR` environment variable:
```bash
export OPENCLAW_SKILLS_DIR=/path/to/skills
```

## Examples

```bash
# Search for calendar-related skills
$ crabskill search calendar

🦀 Found 3 skills:

google-calendar (google-calendar)  Free
   Google Calendar integration for OpenClaw
   ↓ 1.2K  ★★★★☆ (4.3)

outlook-calendar (outlook-calendar)  Free
   Microsoft Outlook Calendar skill
   ↓ 856  ★★★★☆ (4.1)

ical (ical)  $4.99
   Universal iCal/CalDAV calendar support
   ↓ 234  ★★★★★ (4.8)

Install with: npx crabskill install <slug>
```

```bash
# Install and show info
$ crabskill install google-calendar
✓ Installed google-calendar v1.2.0
   → /Users/you/.openclaw/workspace/skills/google-calendar

$ crabskill info google-calendar

🦀 google-calendar (google-calendar)
Google Calendar integration for OpenClaw

Version:     1.2.0
Price:       Free
Downloads:   1,234
Rating:      ★★★★☆ (4.3)
Author:      ShellCorp
Category:    Productivity
Installed:   Yes (v1.2.0)
```

## Requirements

- Node.js 16+
- OpenClaw (for using installed skills)

## Links

- [CrabSkill Marketplace](https://crabskill.com)
- [Documentation](https://docs.crabskill.com)
- [API Reference](https://docs.crabskill.com/api)
- [OpenClaw](https://openclaw.dev)

## License

MIT © [ShellCorp](https://shellcorp.net)
