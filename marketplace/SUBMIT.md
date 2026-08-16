# 提交到插件市场（dsh-market / awesome-dsh-plugin）

dsh 内置的插件市场读取策展仓库 **awesome-dsh-plugin**
（https://github.com/awesome-dsh-plugin/awesome-dsh-plugin）的注册清单；
只有清单内的来源才允许安装。让 `dsh-console` 上架，需要两步：

## 第一步：把插件推到 GitHub（并可选发 npm）

1. 在 GitHub 新建仓库，例如 `dsh-console`（建议公开）。
2. 推送本目录代码：

```sh
git remote add origin https://github.com/<你的用户名>/dsh-console.git
git push -u origin main
```

3. （推荐）发布到 npm，用户可直接 `dsh plugin add dsh-console` 安装：

```sh
npm login
npm publish --access public
```

> 只发 GitHub 也可以：`dsh plugin --profile web add github:<你的用户名>/dsh-console`
> （GitHub 安装会跑 `prepare` 脚本；本包无构建步骤，`prepare` 无需特殊处理）。

## 第二步：把条目加进 awesome-dsh-plugin 注册清单

1. 打开 https://github.com/awesome-dsh-plugin/awesome-dsh-plugin
2. 找到注册数据文件（`registry.json` 或类似，参考现有条目）。
3. 把 `marketplace/dsh-console.entry.json` 里的条目复制进去，
   把 `YOUR_GITHUB_USERNAME` 换成你的真实用户名。
4. 提 PR。合并后，用户在 DSH 设置 → 插件市场里即可搜索到 `dsh-console`。

## 条目字段说明

| 字段 | 值 | 说明 |
| --- | --- | --- |
| `name` | `dsh-console` | 插件名 |
| `owner` | 你的 GitHub 用户名 | 仓库所有者 |
| `url` | 仓库地址 | 必须真实可达（市场会校验来源） |
| `category` | `tools` | 分类（tools = 工具与能力） |
| `description` | en/zh 双语 | 会按界面语言显示 |
| `npm` | `dsh-console` | 发布了 npm 就填包名；没发布填 `null` 并改 `install` 为 github 形式 |
| `install` | 安装命令 | 与 `npm` 对应 |

## 本地快速验证（提交前自查）

```sh
pnpm pack                                   # 打出 dsh-console-0.1.0.tgz
dsh plugin --profile test-console add ./dsh-console-0.1.0.tgz
dsh --profile test-console --dump-config   # 应出现 "# == dsh-console" 层
npm test                                    # 后端只读冒烟
```
