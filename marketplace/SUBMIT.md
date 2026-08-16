# 提交到插件市场（awesome-dsh-plugin）

dsh 插件市场（`dsh-market`，DSH 设置 → 插件市场）由策展清单
**awesome-dsh-plugin**（https://github.com/awesome-dsh-plugin/awesome-dsh-plugin）驱动。
官方提交方式（见仓库 `contributing.md`）：**给 README 加一行**的 PR。

## 需要你完成的步骤（需要你的 GitHub 登录）

### 1. 给仓库加 `dsh-plugin` topic（必选）

打开 https://github.com/Isanti2016/dsh-console → **About**（右上）→ ⚙️ →
Topics 里加 `dsh-plugin`，Save。

### 2. 提 PR 给 awesome-dsh-plugin 加两行

Fork https://github.com/awesome-dsh-plugin/awesome-dsh-plugin，在**两个文件**对应分类下各加一行：

**`README.md`**，放在 `### Tools & Capabilities` 分类末尾：

```markdown
- [Isanti2016/dsh-console](https://github.com/Isanti2016/dsh-console) - Slash-command console for dsh: /web start|stop|restart|status, /tunnel SSH forward management, one-shot /ask, and a console TUI launcher.
```

**`README.zh.md`**，放在 `### 🛠️ 工具与能力` 分类末尾：

```markdown
- [Isanti2016/dsh-console](https://github.com/Isanti2016/dsh-console) - dsh 控制台命令：/web 启动/停止/重启/状态、/tunnel SSH 隧道管理、/ask 一次性问答、/console 启动控制台 TUI。
```

合并后网站自动重建，用户在 DSH 插件市场即可搜到 `dsh-console`。

## 官方要求核对

| 要求 | 状态 |
| --- | --- |
| `package.json` 声明 `dsh.bundle`（含 `cordis.patch.yml`） | ✅ |
| 真实可用代码（非占位/纯 README） | ✅ |
| 仓库加 `dsh-plugin` topic | ⏳ 见步骤 1 |
| 描述只讲功能、无营销词 | ✅ |
| 活跃维护 | ✅（有问题可在仓库 issue 反馈） |
| （推荐）发布 npm，官方包用 peerDependencies | ✅ peerDependencies 已按规范；npm 发布见下 |

## （可选）发布到 npm —— 安装体验更好

```sh
npm login
npm publish --access public
```

发布后用户可直接 `dsh plugin --profile web add dsh-console`（免 GitHub 构建授权）。

## 本地自查（提交 PR 前）

```sh
npm test                      # 后端只读冒烟
pnpm pack                     # 打出 dsh-console-0.1.0.tgz
dsh plugin --profile t add ./dsh-console-0.1.0.tgz
dsh --profile t --dump-config # 应出现 "# == dsh-console" 层
```
