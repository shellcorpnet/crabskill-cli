const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.crabskill');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  apiKey: null,
  baseUrl: 'https://crabskill.com/api',
};

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function load() {
  ensureConfigDir();
  
  if (!fs.existsSync(CONFIG_FILE)) {
    return { ...DEFAULT_CONFIG };
  }
  
  try {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch (err) {
    return { ...DEFAULT_CONFIG };
  }
}

function save(config) {
  ensureConfigDir();
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getApiKey() {
  const config = load();
  return config.apiKey;
}

function setApiKey(key) {
  const config = load();
  config.apiKey = key;
  save(config);
}

function getBaseUrl() {
  const config = load();
  return config.baseUrl;
}

function isAuthenticated() {
  return !!getApiKey();
}

module.exports = {
  load,
  save,
  getApiKey,
  setApiKey,
  getBaseUrl,
  isAuthenticated,
  CONFIG_DIR,
  CONFIG_FILE,
};
