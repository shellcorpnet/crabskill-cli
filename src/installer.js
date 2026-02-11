const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const AdmZip = require('adm-zip');
const config = require('./config');
const { ensureSkillsDir, getSkillPath, isSkillInstalled } = require('./utils');

async function downloadAndExtract(slug, options = {}) {
  const baseUrl = config.getBaseUrl();
  const apiKey = config.getApiKey();
  
  // Build download URL
  const downloadUrl = `${baseUrl}/skills/${slug}/download`;
  
  const headers = {
    'Accept': 'application/zip',
    'User-Agent': 'crabskill-cli/1.0.0',
  };
  
  if (apiKey) {
    headers['X-API-Key'] = apiKey;
  }
  
  // Download the zip
  const response = await fetch(downloadUrl, { headers });
  
  if (!response.ok) {
    // Try to get error message from JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const error = await response.json();
      throw new Error(error.message || error.error || `Download failed: HTTP ${response.status}`);
    }
    throw new Error(`Download failed: HTTP ${response.status} ${response.statusText}`);
  }
  
  // Get the zip data
  const buffer = await response.buffer();
  
  if (buffer.length < 100) {
    throw new Error('Downloaded file is too small - may be an error response');
  }
  
  // Ensure skills directory exists
  const skillsDir = ensureSkillsDir();
  const skillPath = getSkillPath(slug);
  
  // Remove existing if force update
  if (options.force && fs.existsSync(skillPath)) {
    fs.rmSync(skillPath, { recursive: true, force: true });
  }
  
  // Check if already exists
  if (fs.existsSync(skillPath) && !options.force) {
    throw new Error(`Skill "${slug}" is already installed. Use --force to overwrite.`);
  }
  
  // Create skill directory
  if (!fs.existsSync(skillPath)) {
    fs.mkdirSync(skillPath, { recursive: true });
  }
  
  // Extract the zip
  const zip = new AdmZip(buffer);
  const entries = zip.getEntries();
  
  // Check if zip has a root directory (common in GitHub-style zips)
  const hasRootDir = entries.length > 0 && 
    entries.every(e => e.entryName.includes('/')) &&
    entries[0].entryName.split('/')[0] === entries[entries.length - 1].entryName.split('/')[0];
  
  if (hasRootDir) {
    // Strip the root directory
    const rootDir = entries[0].entryName.split('/')[0] + '/';
    for (const entry of entries) {
      const relativePath = entry.entryName.slice(rootDir.length);
      if (!relativePath) continue;
      
      if (entry.isDirectory) {
        const dirPath = path.join(skillPath, relativePath);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      } else {
        const filePath = path.join(skillPath, relativePath);
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, entry.getData());
      }
    }
  } else {
    // Extract directly
    zip.extractAllTo(skillPath, true);
  }
  
  // Verify SKILL.md exists
  const skillMdPath = path.join(skillPath, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    // Check in subdirectories
    const findSkillMd = (dir) => {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        if (file.name === 'SKILL.md') return path.join(dir, file.name);
        if (file.isDirectory()) {
          const found = findSkillMd(path.join(dir, file.name));
          if (found) return found;
        }
      }
      return null;
    };
    
    const found = findSkillMd(skillPath);
    if (!found) {
      // Clean up
      fs.rmSync(skillPath, { recursive: true, force: true });
      throw new Error('Invalid skill package: SKILL.md not found');
    }
  }
  
  return {
    path: skillPath,
    slug,
  };
}

async function uninstallSkill(slug) {
  const skillPath = getSkillPath(slug);
  
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Skill "${slug}" is not installed.`);
  }
  
  fs.rmSync(skillPath, { recursive: true, force: true });
  
  return { slug, path: skillPath };
}

module.exports = {
  downloadAndExtract,
  uninstallSkill,
};
