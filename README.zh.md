# dsh-console

[DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 的控制台命令插件：网页服务管理、SSH 隧道管理、一次性问答、可选的控制台 TUI 启动——全部在斜杠命令里完成。

## 快速接入

```sh
# 1. 安装 bundle
dsh plugin --profile web add dsh-console

# 2. 重启 dsh web，然后直接用命令
/web status
/tunnel status
```

开箱即用：`/web` 和 `/tunnel status` 零配置可用（插件自动探测运行中的 dsh 入口）。隧道主机和控制台 TUI 路径在 profile 的 `cordis.patch.yml` 里配置：

```yaml
- id: dsh-console
  config:
    tunnelHost: '192.168.1.100'        # 你的 SSH 服务器
    tunnelUser: 'root'
    tunnelKey: 'C:\\Users\\you\\.ssh\\id_rsa'
    consoleCommand: 'python C:\\tools\\dsh-tui\\main.py'
```

再次 `dsh plugin --profile web` 并重启后，`/tunnel start`、`/console` 即可用。

## 命令

| 命令 | 说明 |
| --- | --- |
| `/web status` | 网页界面是否在运行（端口 + PID） |
| `/web start` | 后台启动网页界面（`node <dshBin> web --port <webPort>`） |
| `/web stop` | 停止网页界面进程 |
| `/web restart` | 重启 |
| `/tunnel status` | 隧道是否在运行 |
| `/tunnel start` | 启动 SSH 隧道（需配置 `tunnelHost`） |
| `/tunnel stop` | 停止隧道 |
| `/ask <问题>` | 走 headless 的一次性问答（有超时保护） |
| `/console` | 启动控制台 TUI（需配置 `consoleCommand`） |

## 配置

所有键都有合理默认值；在 profile 的 `cordis.patch.yml`（或 `--patch` 覆盖）里修改本 bundle 添加的行的 config：

```yaml
- id: dsh-console
  config:
    webPort: 3080            # dsh 网页界面端口
    dshBin: ''               # apps/cli/lib/bin.js 路径；为空时自动探测
    tunnelHost: '192.168.1.100'
    tunnelUser: 'root'
    tunnelKey: 'C:\\Users\\you\\.ssh\\id_rsa'
    tunnelLocalPort: 3081
    tunnelRemotePort: 3080
    askTimeout: 150
    consoleCommand: 'python C:\\tools\\dsh-tui\\main.py'
```

| 键 | 默认 | 含义 |
| --- | --- | --- |
| `webPort` | `3080` | dsh 网页界面默认监听 `127.0.0.1:3080`；`/web start` 在此启动。 |
| `dshBin` | 自动 | 你代码仓库里 `apps/cli/lib/bin.js` 的绝对路径。为空时从运行进程探测（`process.argv[1]`），源码方式跑的 `dsh` 一般无需配置。 |
| `tunnelHost` | `''` | SSH 服务器地址。为空禁用 `/tunnel start`。 |
| `tunnelUser` | `root` | 服务器上的 SSH 用户。 |
| `tunnelKey` | `''` | SSH 私钥绝对路径（`-i`）。用 agent/其他认证时可省略。 |
| `tunnelLocalPort` | `3081` | 隧道本地监听端口（`127.0.0.1:3081`）。 |
| `tunnelRemotePort` | `3080` | 隧道转发到的远程端口（服务器上的 `127.0.0.1:3080`）。 |
| `askTimeout` | `150` | `/ask` 超时秒数，超时自动终止。 |
| `consoleCommand` | `''` | 启动你的控制台 TUI 的 shell 命令。 |

### 隧道接线方式

```
你的机器                          SSH 服务器 (tunnelHost)
127.0.0.1:3081  ──ssh -L──▶  127.0.0.1:3080
   ▲                               ▲
   │  /tunnel start 在此监听        │  dsh web 或其他服务跑在这里
```

`/tunnel start` 会执行 `ssh -N -L <tunnelLocalPort>:127.0.0.1:<tunnelRemotePort> <tunnelUser>@<tunnelHost>`（配置了 `tunnelKey` 时加 `-i`）作为后台进程。`/tunnel stop` 找到并杀掉监听 `tunnelLocalPort` 的进程。

### 典型场景

- **本机启动器（CLI/headless profile）**——终端里管理网页：`/web start` → 打开 `http://127.0.0.1:3080`；`/web stop` 停止。
- **远程网页（本机要访问另一台机器）**——把 `tunnelHost` 指向远程，浏览器访问 `http://127.0.0.1:<tunnelLocalPort>`。
- **在 web profile 自身里**——`/web status`、`/tunnel status` 安全；`/web stop|restart` 会杀掉正在服务当前界面的进程，请谨慎。

## 安全提示

- `/web stop` / `/web restart` 在 web profile 里执行会杀掉正在服务当前界面的进程。
- `/tunnel start` 会用你配置的密钥执行 `ssh`——只配置可信来源的密钥。
- `/ask` 会跑 headless 并消耗模型额度；结果由命令平面渲染，不进入模型历史。

## 开发

```sh
npm test          # 后端原语 node 测试（只读）
pnpm pack         # 打出可安装的 tarball
```

本 bundle 无构建步骤：纯 ESM，发布 `index.js` + `lib/` + `cordis.patch.yml`。
