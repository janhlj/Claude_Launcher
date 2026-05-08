const fs = require('fs');
const path = require('path');
const os = require('os');

function getUserConfigPath() {
  const configDir = path.join(os.homedir(), '.config', 'claude-launcher');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return path.join(configDir, 'config.json');
}

function expandPath(p, cwd = process.cwd()) {
  if (p.startsWith('~/') || p === '~') {
    // ~ means current working directory (where launcher was invoked), not home
    return cwd;
  }
  // Convert Git Bash /c/... style paths to Windows C:\... paths
  if (/^\/[a-z]\//i.test(p)) {
    return p[1].toUpperCase() + ':' + p.slice(2);
  }
  return p;
}

function loadConfig() {
  const userPath = getUserConfigPath();

  if (fs.existsSync(userPath)) {
    try {
      return JSON.parse(fs.readFileSync(userPath, 'utf8'));
    } catch (e) {
      throw new Error(`解析用户配置失败：${e.message}`);
    }
  }

  throw new Error(`未找到配置文件：${userPath}`);
}

function saveConfig(cfg) {
  const userPath = getUserConfigPath();
  fs.writeFileSync(userPath, JSON.stringify(cfg, null, 2), 'utf8');
}

module.exports = { loadConfig, saveConfig, expandPath, getUserConfigPath };
