#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');

const skillsDir = process.env.OPENCLAW_SKILLS_DIR || path.join(os.homedir(), '.openclaw', 'workspace', 'skills');
const targetDir = path.join(skillsDir, 'crabskill');
const sourceDir = path.join(__dirname, '..', 'skill');

// Only install if OpenClaw workspace exists
const workspaceDir = path.join(os.homedir(), '.openclaw', 'workspace');
if (!fs.existsSync(workspaceDir)) {
  // No OpenClaw installation found, skip silently
  process.exit(0);
}

try {
  // Ensure skills directory exists
  if (!fs.existsSync(skillsDir)) {
    fs.mkdirSync(skillsDir, { recursive: true });
  }

  // Copy skill files recursively
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  copyDir(sourceDir, targetDir);
  console.log('🦀 CrabSkill meta-skill installed to OpenClaw workspace');
} catch (err) {
  // Don't fail the install if this doesn't work
  // (user might not have OpenClaw or permissions)
}
