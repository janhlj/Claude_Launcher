# Claude Launcher

TUI 启动器，通过菜单选择工作目录、API 配置和启动参数，然后启动 Claude Code。支持 MiniMax、阿里云百炼、LM Studio、NewAPI 等多种渠道，一键切换。

## 功能特点

- **快速切换工作目录** — 不用再 cd，一键选择项目目录
- **多 API 渠道管理** — MiniMax、阿里云编程、阿里百炼、Anthropic、OpenAI、LM Studio、NewAPI 等
- **模型自动注入** — 每个渠道可配置默认模型，启动时自动设置 `ANTHROPIC_MODEL`
- **启动参数快捷勾选** — `--no-cache`、`--dangerously-skip-permissions`、`--resume` 等
- **本地模型支持** — LM Studio（Anthropic 兼容模式）、NewAPI 等本地/内网 API
- **零依赖打包** — 可用 `pkg` 打包成单文件 exe

## 安装

```bash
npm install
npm link
```

安装后全局命令为 `cl`。

## 配置

全局配置路径：`~/.config/claude-launcher/config.json`

首次使用可复制模板：

```bash
mkdir -p ~/.config/claude-launcher
cp config.json.example ~/.config/claude-launcher/config.json
```

编辑 `~/.config/claude-launcher/config.json`，填写你的 API Key 和工作目录。

### config.json 说明

```json
{
  // 工作目录列表（~ 会自动展开为用户家目录，/c/ 或 /h/ 格式为 Git Bash 路径）
  "workingDirectories": [
    "~",
    "/c/Projects/my-project"
  ],

  // API 配置列表（第一个为默认选中）
  "apiConfigs": [
    {
      "name": "minimax",
      "displayName": "⬆ MiniMax (默认)",
      "apiKey": "sk-xxxx",           // 留空则沿用环境变量
      "apiBase": "https://api.minimax.chat/v1",
      "defaultModel": "MiniMax-M2.7-highspeed",
      "envVars": {}
    },
    {
      "name": "alibaba-coding",
      "displayName": "⬆ 阿里云编程",
      "apiKey": "",
      "apiBase": "https://coding.dashscope.aliyuncs.com/apps/anthropic",
      "defaultModel": "qwen3.6-plus",
      "keyEnvVar": "ANTHROPIC_AUTH_TOKEN",   // LM Studio 等特殊渠道用这个
      "baseUrlEnvVar": "ANTHROPIC_BASE_URL",
      "envVars": {}
    },
    {
      "name": "lmstudio",
      "displayName": "本地LMStudio",
      "apiKey": "lmstudio-token",
      "apiBase": "http://192.168.1.100:12345",
      "keyEnvVar": "ANTHROPIC_AUTH_TOKEN",
      "baseUrlEnvVar": "ANTHROPIC_BASE_URL",
      "defaultModel": "qwen/qwen3.6-35b-a3b",
      "envVars": {}
    }
  ],

  // 启动参数
  "launchArguments": [
    { "name": "--no-cache", "description": "禁用上下文缓存", "requiresValue": false },
    { "name": "--dangerously-skip-permissions", "description": "跳过权限确认", "requiresValue": false },
    { "name": "--resume", "description": "恢复指定会话", "requiresValue": true }
  ],

  // claude 命令（完整路径或已在 PATH 中的命令名）
  "claudeCommand": "claude"
}
```

### 字段说明

| 字段 | 说明 |
|------|------|
| `apiKey` | API 密钥，留空沿用环境变量 |
| `apiBase` | API 端点，会设置到 `ANTHROPIC_API_BASE`（或 `ANTHROPIC_BASE_URL`） |
| `defaultModel` | 设置到 `ANTHROPIC_MODEL`，启动时自动使用 |
| `keyEnvVar` | 指定自定义环境变量名（默认 `ANTHROPIC_API_KEY`） |
| `baseUrlEnvVar` | 指定 base URL 环境变量名（默认 `ANTHROPIC_API_BASE`） |
| `envVars` | 额外的自定义环境变量 |

### 本地 LM Studio 配置

在 LM Studio 中开启 Anthropic 兼容模式（Developer → Enable Anthropic Compatibility），然后：

```json
{
  "name": "lmstudio",
  "displayName": "本地LMStudio",
  "apiKey": "你的 LM Studio Token",
  "apiBase": "http://192.168.1.100:12345",
  "keyEnvVar": "ANTHROPIC_AUTH_TOKEN",
  "baseUrlEnvVar": "ANTHROPIC_BASE_URL",
  "defaultModel": "qwen/qwen3.6-35b-a3b"
}
```

### 本地 NewAPI 配置

NewAPI 需要填入你在后台配置的模型名称：

```json
{
  "name": "newapi",
  "displayName": "本地NewAPI",
  "apiKey": "你的 NewAPI Key",
  "apiBase": "http://192.168.1.200:3000/v1/message",
  "defaultModel": "qwen3.5-flash"
}
```

## 使用

```bash
cl
```

或直接运行：

```bash
node index.js
```

## 操作

| 命令 | 作用 |
|------|------|
| `j` / `s` | 切换到下一个区域 |
| `k` / `w` | 切换到上一个区域 |
| `h` / `z` | 在当前区域选择上一个 |
| `l` / `x` | 在当前区域选择下一个 |
| `1` `2` `3`... | 直接选中当前区域的第 N 项 |
| `空格` / `t` | 勾选/取消启动参数 |
| `r` | 启动 Claude Code |
| `q` | 退出 |

## 打包为单文件

```bash
npm install -g pkg
pkg index.js -t node18-win-x64 -o claude-launcher.exe
```

## License

MIT
