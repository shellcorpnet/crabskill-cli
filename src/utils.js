const path = require('path');
const os = require('os');
const fs = require('fs');
const { exec } = require('child_process');

// Get the skills directory
function getSkillsDir() {
  // Check env var first
  if (process.env.OPENCLAW_SKILLS_DIR) {
    return process.env.OPENCLAW_SKILLS_DIR;
  }
  
  // Default OpenClaw location
  return path.join(os.homedir(), '.openclaw', 'workspace', 'skills');
}

// Ensure the skills directory exists
function ensureSkillsDir() {
  const dir = getSkillsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Get the path for a specific skill
function getSkillPath(slug) {
  return path.join(getSkillsDir(), slug);
}

// Check if a skill is installed
function isSkillInstalled(slug) {
  const skillPath = getSkillPath(slug);
  return fs.existsSync(skillPath) && fs.existsSync(path.join(skillPath, 'SKILL.md'));
}

// Read installed skill's SKILL.md to get version
function getInstalledSkillVersion(slug) {
  const skillMdPath = path.join(getSkillPath(slug), 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    return null;
  }
  
  try {
    const content = fs.readFileSync(skillMdPath, 'utf8');
    // Look for version in frontmatter or metadata
    const versionMatch = content.match(/version:\s*["']?([^"'\n]+)["']?/i) ||
                        content.match(/Version:\s*(\S+)/i);
    return versionMatch ? versionMatch[1].trim() : 'unknown';
  } catch {
    return null;
  }
}

// List all installed skills
function listInstalledSkills() {
  const skillsDir = getSkillsDir();
  if (!fs.existsSync(skillsDir)) {
    return [];
  }
  
  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  return entries
    .filter(entry => entry.isDirectory())
    .filter(entry => fs.existsSync(path.join(skillsDir, entry.name, 'SKILL.md')))
    .map(entry => ({
      slug: entry.name,
      path: path.join(skillsDir, entry.name),
      version: getInstalledSkillVersion(entry.name),
    }));
}

// Format price
function formatPrice(pricingType, priceCents) {
  if (pricingType === 'free') return 'Free';
  if (pricingType === 'pay_what_you_want') return 'Pay what you want';
  if (priceCents === 0) return 'Free';
  return `$${(priceCents / 100).toFixed(2)}`;
}

// Format rating
function formatRating(rating) {
  if (!rating || rating === 0) return '—';
  const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  return `${stars} (${rating.toFixed(1)})`;
}

// Format number with K/M suffix
function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

// Open URL in browser
function openBrowser(url) {
  const platform = process.platform;
  let cmd;
  
  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  
  return new Promise((resolve, reject) => {
    exec(cmd, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Truncate string with ellipsis
function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

// Pad string to length
function padEnd(str, len) {
  str = str || '';
  return str.length >= len ? str : str + ' '.repeat(len - str.length);
}

module.exports = {
  getSkillsDir,
  ensureSkillsDir,
  getSkillPath,
  isSkillInstalled,
  getInstalledSkillVersion,
  listInstalledSkills,
  formatPrice,
  formatRating,
  formatNumber,
  openBrowser,
  truncate,
  padEnd,
};
