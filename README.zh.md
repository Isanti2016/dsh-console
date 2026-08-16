# dsh-console

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的控制台命令插件：网页服务管理、SSH 隧道管理、一次性问答、以及可选的 [dsh-tui](https://github.com/dsh-console/dsh-tui) 操作台启动——全部在斜杠命令里完成。

## 安装

```sh
# 从 npm（发布后）
dsh plugin --profile web add dsh-console

# 或从本仓库
dsh plugin --profile web add ./dsh-console
```

重启 `dsh web`，输入 `/help` 或打开命令面板即可看到。

## 命令

| 命令 | 说明 |
| --- | --- |
| `/web status` | 网页界面是否在运行（端口 + PID） |
| `/web start` | 后台启动网页界面（`node bin.js web`） |
| `/web stop` | 停止网页界面进程 |
| `/web restart` | 重启 |
| `/tunnel status` | 隧道是否在运行 |
| `/tunnel start` | 启动 SSH 隧道（需配置 `tunnelHost`） |
| `/tunnel stop` | 停止隧道 |
| `/ask <问题>` | 走 headless 的一次性问答（有超时保护） |
| `/console` | 启动 dsh-tui（需配置 `consoleCommand`） |

## 配置

在 profile 的 `cordis.patch.yml`（或 `--patch` 覆盖）里改本 bundle 添加的行的 config：

```yaml
- id: dsh-console
  config:
    webPort: 3080
    dshBin: ''            # 为空时从运行中的进程自动探测
    tunnelHost: '192.168.31.12'
    tunnelUser: 'root'
    tunnelKey: 'C:\\Users\\me\\.ssh\\id_rsa'
    tunnelLocalPort: 3081
    tunnelRemotePort: 3080
    askTimeout: 150
    consoleCommand: 'python G:\\tools\\dsh-tui\\main.py'
```

| 键 | 默认 | 含义 |
| --- | --- | --- |
| `webPort` | `3080` | dsh 网页界面端口 |
| `dshBin` | 自动 | `apps/cli/lib/bin.js` 路径；为空时从运行进程探测 |
| `tunnelHost` | `''` | SSH 目标主机；为空禁用 `/tunnel start` |
| `tunnelUser` | `root` | SSH 用户 |
| `tunnelKey` | `''` | SSH 私钥路径（`-i`） |
| `tunnelLocalPort` | `3081` | 本地隧道监听端口 |
| `tunnelRemotePort` | `3080` | 隧道转发的远程端口 |
| `askTimeout` | `150` | `/ask` 超时秒数，超时自动终止 |
| `consoleCommand` | `''` | 启动 dsh-tui 的 shell 命令 |

## 安全提示

- 在 web profile 里执行 `/web stop` / `/web restart` 会杀掉正在服务当前界面的进程——请谨慎操作，或把本 bundle 装到 CLI/headless profile 使用。
- `/tunnel start` 会用你配置的密钥执行 `ssh`，只配置可信来源的 `tunnelKey`。
- `/ask` 会跑 headless 并消耗模型额度；结果由命令平面渲染，不进入模型历史。

## 开发

```sh
npm test          # 后端原语 node 测试（只读）
```

本 bundle 无构建步骤：纯 ESM，发布 `index.js` + `lib/` + `cordis.patch.yml`。
