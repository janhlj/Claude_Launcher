const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CONFIG = {
  workingDirectories: ['~', '~/projects'],
  apiConfigs: [
    {
      name: 'anthropic',
      displayName: 'Anthropic (默认)',
      apiKey: '',
      apiBase: 'https://api.anthropic.com',
      envVars: {},
    },
  ],
  launchArguments: [
    { name: '--no-cache', description: '禁用上下文缓存', requiresValue: false },
    { name: '--dangerously-skip-permissions', description: '跳过权限确认', requiresValue: false },
    { name: '--resume', description: '恢复指定会话', requiresValue: true },
  ],
  claudeCommand: 'claude',
};

function getUserConfigPath() {
  const configDir = path.join(os.homedir(), '.config', 'claude-launcher');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return path.join(configDir, 'config.json');
}

function getBundledConfigPath() {
  // In case we're running from the source dir
  return path.join(__dirname, 'config.json');
}

function expandPath(p) {
  if (p.startsWith('~/') || p === '~') {
    return path.join(os.homedir(), p.slice(1));
  }
  // Convert Git Bash /c/... style paths to Windows C:\... paths
  if (/^\/[a-z]\//i.test(p)) {
    return p[1].toUpperCase() + ':' + p.slice(2);
  }
  return p;
}

function loadConfig() {
  const userPath = getUserConfigPath();

  // Try user config first
  if (fs.existsSync(userPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(userPath, 'utf8'));
      return mergeDefaults(data);
    } catch (e) {
      console.warn(`[claude-launcher] 用户配置解析失败: ${e.message}`);
    }
  }

  // Fallback to bundled config.json next to the script
  const bundledPath = getBundledConfigPath();
  if (fs.existsSync(bundledPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(bundledPath, 'utf8'));
      return mergeDefaults(data);
    } catch (e) {
      console.warn(`[claude-launcher] 内置配置解析失败: ${e.message}`);
    }
  }

  return { ...DEFAULT_CONFIG };
}

function mergeDefaults(cfg) {
  // Fill in any missing fields from defaults
  return {
    ...DEFAULT_CONFIG,
    ...cfg,
    apiConfigs: cfg.apiConfigs || DEFAULT_CONFIG.apiConfigs,
    launchArguments: cfg.launchArguments || DEFAULT_CONFIG.launchArguments,
    workingDirectories: cfg.workingDirectories || DEFAULT_CONFIG.workingDirectories,
  };
}

function saveConfig(cfg) {
  const userPath = getUserConfigPath();
  fs.writeFileSync(userPath, JSON.stringify(cfg, null, 2), 'utf8');
}

module.exports = { loadConfig, saveConfig, expandPath, getUserConfigPath };
