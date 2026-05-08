#!/usr/bin/env node
const { loadConfig } = require('./config');
const { runMenu } = require('./launcher');

async function main() {
  const cfg = loadConfig();

  console.log('\x1b[36m╭────────────────────────────────────────────────────╮\x1b[0m');
  console.log('\x1b[36m│\x1b[0m  \x1b[1m\x1b[36mClaude Launcher\x1b[0m\x1b[0m                               \x1b[36m│\x1b[0m');
  console.log('\x1b[36m│\x1b[0m  \x1b[2m配置文件: ~\x1b[2m/.config/claude-launcher/config.json\x1b[0m  \x1b[36m│\x1b[0m');
  console.log('\x1b[36m╰────────────────────────────────────────────────────╯\x1b[0m');

  try {
    await runMenu(cfg);
  } catch (e) {
    console.error('\x1b[31m错误:\x1b[0m', e.message);
    process.exit(1);
  }
}

main();
