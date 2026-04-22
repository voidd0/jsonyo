// jsonyo - config management
// https://voiddo.com/tools/jsonyo/

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.jsonyo');
const LICENSE_FILE = path.join(CONFIG_DIR, 'license');
const USAGE_FILE = path.join(CONFIG_DIR, 'usage.json');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

function getLicense() {
  // Check env var first
  if (process.env.JSONYO_LICENSE) {
    return process.env.JSONYO_LICENSE.trim();
  }

  // Check config file
  try {
    if (fs.existsSync(LICENSE_FILE)) {
      return fs.readFileSync(LICENSE_FILE, 'utf8').trim();
    }
  } catch (e) {
    // ignore
  }

  return null;
}

function setLicense(key) {
  ensureConfigDir();
  fs.writeFileSync(LICENSE_FILE, key.trim());
}

function getUsage() {
  ensureConfigDir();
  const today = new Date().toISOString().split('T')[0];

  try {
    if (fs.existsSync(USAGE_FILE)) {
      const data = JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8'));
      // Reset if new day
      if (data.date !== today) {
        return { date: today, operations: 0 };
      }
      return data;
    }
  } catch (e) {
    // ignore
  }

  return { date: today, operations: 0 };
}

function saveUsage(usage) {
  ensureConfigDir();
  fs.writeFileSync(USAGE_FILE, JSON.stringify(usage, null, 2));
}

function incrementUsage() {
  const usage = getUsage();
  usage.operations++;
  saveUsage(usage);
  return usage;
}

function getConfig() {
  ensureConfigDir();

  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    // ignore
  }

  return {};
}

function setConfig(key, value) {
  ensureConfigDir();
  const config = getConfig();
  config[key] = value;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

module.exports = {
  CONFIG_DIR,
  LICENSE_FILE,
  USAGE_FILE,
  getLicense,
  setLicense,
  getUsage,
  saveUsage,
  incrementUsage,
  getConfig,
  setConfig,
};
