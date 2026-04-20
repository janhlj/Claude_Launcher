const { spawn } = require('child_process');
const readline = require('readline');
const { loadConfig, expandPath } = require('./config');

// ANSI colors for TUI
const C = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  red: '\x1b[31m',
  white: '\x1b[37m',
  gray: '\x1b[90m',
  bgBlue: '\x1b[44m',
};

async function runMenu(cfg) {
  let selectedDir = 0;
  let selectedAPI = 0;
  let selectedArgs = cfg.launchArguments.map(() => false);
  let argInputValues = cfg.launchArguments.map(() => '');
  // Default: skip permissions check
  const skipPermIdx = cfg.launchArguments.findIndex(a => a.name === '--dangerously-skip-permissions');
  if (skipPermIdx >= 0) selectedArgs[skipPermIdx] = true;
  let cursor = 0; // 0=dirs, 1=apis, 2=args
  let exit = false;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer: (line) => [[], line],
  });

  async function prompt(question) {
    return new Promise((resolve) => {
      rl.question(`${C.cyan}${question}${C.reset}`, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async function render() {
    process.stdout.write('\x1b[2J\x1b[H');

    const W = 56;
    const sec = ['📁 工作目录', '🔑 API 配置', '⚙️ 启动参数'];
    const cursors = ['←→', '←→', '空格'];

    // Header
    console.log(`${C.cyan}  🧙 Claude Launcher${C.reset}  ${C.dim}(编辑 config.json 修改配置)${C.reset}`);
    console.log('');

    // Section: Working Directories
    const s1active = cursor === 0;
    console.log(`  ${s1active ? C.bright + C.cyan : C.dim}▶ ${sec[0]}${C.reset}  ${C.dim}${cursors[0]}${C.reset}`);
    cfg.workingDirectories.forEach((dir, i) => {
      const absDir = expandPath(dir);
      const mark = i === selectedDir ? `${C.green}➤${C.reset} ` : '   ';
      const style = s1active && i === selectedDir ? C.bright + C.white : C.dim;
      console.log(`    ${mark}${style}[${i + 1}] ${dir}${C.reset}  ${C.dim}→ ${absDir}${C.reset}`);
    });
    console.log('');

    // Section: API Configs
    const s2active = cursor === 1;
    console.log(`  ${s2active ? C.bright + C.cyan : C.dim}▶ ${sec[1]}${C.reset}  ${C.dim}${cursors[1]}${C.reset}`);
    cfg.apiConfigs.forEach((api, i) => {
      const name = api.displayName || api.name;
      const mark = i === selectedAPI ? `${C.green}➤${C.reset} ` : '   ';
      const style = s2active && i === selectedAPI ? C.bright + C.white : C.dim;
      console.log(`    ${mark}${style}[${i + 1}] ○ ${name}${C.reset}`);
      if (s2active && i === selectedAPI && api.defaultModel) {
        console.log(`       ${C.dim}   → 模型: ${C.yellow}${api.defaultModel}${C.reset}`);
      }
    });
    console.log('');

    // Section: Launch Arguments
    const s3active = cursor === 2;
    console.log(`  ${s3active ? C.bright + C.cyan : C.dim}▶ ${sec[2]}${C.reset}  ${C.dim}${cursors[2]}${C.reset}`);
    cfg.launchArguments.forEach((arg, i) => {
      const mark = i === selectedArgIdx(cfg, selectedArgs) ? `${C.green}➤${C.reset} ` : '   ';
      const style = s3active && i === selectedArgIdx(cfg, selectedArgs) ? C.bright + C.white : C.dim;
      const check = selectedArgs[i] ? `${C.green}[✓]${C.reset}` : `${C.dim}[ ]${C.reset}`;
      let extra = '';
      if (selectedArgs[i] && arg.requiresValue && argInputValues[i]) {
        extra = ` ${C.yellow}${argInputValues[i]}${C.reset}`;
      }
      console.log(`    ${mark}${style}[${i + 1}] ${check} ${arg.description}${extra}${C.reset}`);
    });
    console.log('');
    console.log(`${C.dim}  ─────────────────────────────────────────────────${C.reset}`);
    console.log(`${C.dim}  j/k${C.reset} 上/下区域  ${C.dim}h/l${C.reset} 左/右选择  ${C.dim}[n]${C.reset} 选当前区序号  ${C.green}r${C.reset} 启动  ${C.red}q${C.reset} 退出`);
    console.log('');
  }

  function selectedArgIdx(cfg, sel) {
    for (let i = 0; i < cfg.launchArguments.length; i++) {
      if (sel[i]) return i;
    }
    return 0;
  }

  while (!exit) {
    await render();
    const input = await prompt('命令 > ');

    if (!input) continue;

    const cmd = input.toLowerCase();
    const num = parseInt(cmd, 10);

    if (cmd === 'q') {
      rl.close();
      exit = true;
    } else if (cmd === 'j' || cmd === 's') {
      // down / next section
      if (cursor < 2) cursor++;
    } else if (cmd === 'k' || cmd === 'w') {
      // up / prev section
      if (cursor > 0) cursor--;
    } else if (cmd === 'l' || cmd === 'x') {
      // right / select next in current section
      if (cursor === 0 && selectedDir < cfg.workingDirectories.length - 1) selectedDir++;
      if (cursor === 1 && selectedAPI < cfg.apiConfigs.length - 1) selectedAPI++;
      if (cursor === 2) {
        const idx = selectedArgIdx(cfg, selectedArgs);
        if (idx < cfg.launchArguments.length - 1) selectedArgs[idx] = false, selectedArgs[idx + 1] = false;
      }
    } else if (cmd === 'h' || cmd === 'z') {
      // left / select prev in current section
      if (cursor === 0 && selectedDir > 0) selectedDir--;
      if (cursor === 1 && selectedAPI > 0) selectedAPI--;
      if (cursor === 2) {
        const idx = selectedArgIdx(cfg, selectedArgs);
        if (idx > 0) selectedArgs[idx] = false, selectedArgs[idx - 1] = false;
      }
    } else if (cmd === ' ' || cmd === 't') {
      // toggle current arg
      if (cursor === 2) {
        const idx = selectedArgIdx(cfg, selectedArgs);
        const argDef = cfg.launchArguments[idx];
        if (argDef.requiresValue) {
          selectedArgs[idx] = !selectedArgs[idx];
          if (selectedArgs[idx]) {
            const val = await prompt(`  输入 ${C.yellow}${argDef.name}${C.reset} 的值 > `);
            argInputValues[idx] = val;
          }
        } else {
          selectedArgs[idx] = !selectedArgs[idx];
        }
      }
    } else if (cmd === 'r' || cmd === 'enter' || cmd === '\n') {
      // launch - close readline first so stdin is free for claude
      rl.close();
      await launch(cfg, selectedDir, selectedAPI, selectedArgs, argInputValues);
      exit = true;
    } else if (!isNaN(num) && num > 0) {
      // Number key: select item in current section
      if (cursor === 0 && num <= cfg.workingDirectories.length) {
        selectedDir = num - 1;
      } else if (cursor === 1 && num <= cfg.apiConfigs.length) {
        selectedAPI = num - 1;
      } else if (cursor === 2 && num <= cfg.launchArguments.length) {
        // Toggle or just select the arg
        const idx = num - 1;
        const argDef = cfg.launchArguments[idx];
        if (argDef.requiresValue && !selectedArgs[idx]) {
          selectedArgs[idx] = true;
          const val = await prompt(`  输入 ${C.yellow}${argDef.name}${C.reset} 的值 > `);
          argInputValues[idx] = val;
        } else {
          selectedArgs[idx] = !selectedArgs[idx];
        }
      }
    }
  }

  rl.close();
  process.stdout.write('\x1b[2J\x1b[H');
}

async function launch(cfg, dirIdx, apiIdx, selectedArgs, argInputValues) {
  const api = cfg.apiConfigs[apiIdx];
  const dir = expandPath(cfg.workingDirectories[dirIdx]);

  console.log(`\n${C.cyan}🚀 启动 Claude...${C.reset}`);
  console.log(`${C.dim}   目录: ${dir}${C.reset}`);
  console.log(`${C.dim}   API:  ${api.displayName || api.name}${C.reset}`);

  const env = { ...process.env };
  // Clear all Claude-related env vars to avoid conflicts between API configs
  for (const k of Object.keys(env)) {
    if (k.startsWith('ANTHROPIC_')) delete env[k];
  }
  const keyEnv = api.keyEnvVar || 'ANTHROPIC_API_KEY';
  const baseEnv = api.baseUrlEnvVar || 'ANTHROPIC_API_BASE';
  if (api.apiKey) env[keyEnv] = api.apiKey;
  if (api.apiBase) env[baseEnv] = api.apiBase;
  if (api.defaultModel) env.ANTHROPIC_MODEL = api.defaultModel;
  for (const [k, v] of Object.entries(api.envVars || {})) {
    if (v) env[k] = v;
  }

  if (api.defaultModel) {
    console.log(`${C.dim}   模型: ${C.yellow}${api.defaultModel}${C.reset}`);
  }

  const args = [cfg.claudeCommand];
  cfg.launchArguments.forEach((arg, i) => {
    if (selectedArgs[i]) {
      args.push(arg.name);
      if (arg.requiresValue && argInputValues[i]) {
        args.push(argInputValues[i]);
      }
    }
  });

  console.log(`${C.dim}   命令: ${args.join(' ')}${C.reset}\n`);

  const child = spawn(args[0], args.slice(1), {
    cwd: dir,
    env,
    stdio: 'inherit',
    shell: false,
    windowsHide: false,
  });

  return new Promise((resolve) => {
    let resolved = false;
    const doResolve = () => {
      if (resolved) return;
      resolved = true;
      resolve();
    };

    child.on('error', (err) => {
      console.log(`\n${C.red}启动失败: ${err.message}${C.reset}`);
      doResolve();
    });
    child.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.log(`\n${C.red}进程退出，代码: ${code}${C.reset}`);
      }
      doResolve();
    });

    // 交互式进程不退出，2秒后认为启动成功
    setTimeout(() => {
      console.log(`${C.green}Claude Code 已启动${C.reset}`);
      doResolve();
    }, 2000);
  });
}

module.exports = { runMenu };
