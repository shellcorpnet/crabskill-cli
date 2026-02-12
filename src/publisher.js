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
  // Load skill.json for metadata
  const skillJsonPath = path.join(absDir, 'skill.json');
  let skillJson = {};
  if (fs.existsSync(skillJsonPath)) {
    skillJson = JSON.parse(fs.readFileSync(skillJsonPath, 'utf8'));
  }

  // Extract name from SKILL.md frontmatter or heading
  const nameMatch = skillMd.match(/^#\s+(.+)$/m);
  const fmNameMatch = skillMd.match(/^name:\s*(.+)$/m);
  const skillName = skillJson.name || (fmNameMatch && fmNameMatch[1].trim()) || (nameMatch && nameMatch[1].trim()) || path.basename(absDir);

  // Extract description from SKILL.md frontmatter or skill.json
  const fmDescMatch = skillMd.match(/^description:\s*(.+)$/m);
  const description = skillJson.description || (fmDescMatch && fmDescMatch[1].trim()) || '';

  // Build slug from name
  const slug = skillName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const FormData = require('form-data');
  const formData = new FormData();
  formData.append('zip', buffer, {
    filename: 'skill.zip',
    contentType: 'application/zip',
  });
  formData.append('name', skillName);
  formData.append('slug', slug);
  formData.append('description', description);
  formData.append('tagline', skillJson.description || description.substring(0, 255));
  formData.append('version', skillJson.version || '1.0.0');
  formData.append('pricing_type', skillJson.pricing_type || (skillJson.pricing && skillJson.pricing.type) || 'free');

  // Category (slug or name)
  if (skillJson.category) {
    formData.append('category', skillJson.category);
  }

  // Tags — support both "tags" and "keywords" fields
  const tags = skillJson.tags || skillJson.keywords || [];
  if (tags.length) {
    tags.forEach(tag => formData.append('tags[]', tag));
  }

  if (skillJson.min_openclaw_version || (skillJson.openclaw && skillJson.openclaw.minVersion)) {
    formData.append('min_openclaw_version', skillJson.min_openclaw_version || skillJson.openclaw.minVersion);
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
