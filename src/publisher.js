const fs = require('fs');
const path = require('path');
const AdmZip = require('adm-zip');
const api = require('./api');

// Files/directories to exclude from the zip
const EXCLUDE_PATTERNS = [
  '.git',
  '.gitignore',
  '.DS_Store',
  'node_modules',
  '.env',
  '.env.local',
  '__pycache__',
  '*.pyc',
  '.vscode',
  '.idea',
  'thumbs.db',
];

function shouldExclude(name) {
  const lowerName = name.toLowerCase();
  return EXCLUDE_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return lowerName.endsWith(pattern.slice(1));
    }
    return lowerName === pattern.toLowerCase();
  });
}

function addDirectoryToZip(zip, dirPath, zipPath = '') {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (shouldExclude(entry.name)) continue;
    
    const fullPath = path.join(dirPath, entry.name);
    const entryZipPath = zipPath ? `${zipPath}/${entry.name}` : entry.name;
    
    if (entry.isDirectory()) {
      addDirectoryToZip(zip, fullPath, entryZipPath);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.addFile(entryZipPath, content);
    }
  }
}

async function validateAndPackage(directory) {
  const absDir = path.resolve(directory);
  
  // Check directory exists
  if (!fs.existsSync(absDir)) {
    throw new Error(`Directory not found: ${absDir}`);
  }
  
  // Check SKILL.md exists
  const skillMdPath = path.join(absDir, 'SKILL.md');
  if (!fs.existsSync(skillMdPath)) {
    throw new Error(`SKILL.md not found in ${absDir}. Every skill must have a SKILL.md file.`);
  }
  
  // Read SKILL.md to extract metadata
  const skillMdContent = fs.readFileSync(skillMdPath, 'utf8');
  
  // Basic validation - check for required sections
  if (!skillMdContent.includes('#')) {
    throw new Error('SKILL.md must have at least a title heading');
  }
  
  // Create zip
  const zip = new AdmZip();
  addDirectoryToZip(zip, absDir);
  
  // Return the zip buffer
  return {
    buffer: zip.toBuffer(),
    skillMd: skillMdContent,
    directory: absDir,
  };
}

async function publishSkill(directory) {
  const { buffer, skillMd, directory: absDir } = await validateAndPackage(directory);
  
  // Create form data with the zip
  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('skill_zip', buffer, {
    filename: 'skill.zip',
    contentType: 'application/zip',
  });
  
  // Try to extract some metadata from SKILL.md for the request
  const nameMatch = skillMd.match(/^#\s+(.+)$/m);
  if (nameMatch) {
    formData.append('name', nameMatch[1].trim());
  }
  
  // Publish via API
  const result = await api.publishSkill(formData);
  
  return {
    ...result,
    directory: absDir,
  };
}

module.exports = {
  validateAndPackage,
  publishSkill,
};
