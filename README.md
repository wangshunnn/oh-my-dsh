<p align="center">
  <a href="https://oh-my-dsh.vercel.app/">
    <img src="./assets/oh-my-dsh-banner-v2.jpg" alt="All you need is oh-my-dsh" width="100%">
  </a>
</p>

<p align="center">
  <sub>简体中文 · <a href="./README_EN.md">English</a></sub>
</p>

> 🐋 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 社区插件目录：topic 发现，Bundle 清单准入。

**oh-my-dsh** 只展示检测到当前 `dsh.bundle.patch` 清单且安装来源明确的项目，支持根包和经过 npm 归属验证的 monorepo workspace，帮助你搜索、筛选并安装 DSH 插件。

**[访问在线目录](https://oh-my-dsh.vercel.app/)** · **[浏览全部插件](./docs/catalog.md)** · **[查看场景精选](./docs/collections.md)** · **[使用 JSON Registry](./registry/plugins.json)** · **[提交插件](./CONTRIBUTING.md)**

<sub>只有结构可安装的当前 Bundle 才进入公共目录；收录仍不代表兼容性或安全认证。</sub>

<!-- GENERATED:PLUGIN-INDEX:START -->
## 插件目录

**收录 4911 个检测到当前 Bundle 清单的项目**

| 入口 | 适合你在找什么 |
| --- | --- |
| **[浏览全部插件 →](./docs/catalog.md)** | 按类型、分类、Stars 和许可证浏览可安装目录 |
| **[查看场景精选 →](./docs/collections.md)** | Coding、Research、Web UI 等开箱方向 |
| **[使用 JSON Registry →](./registry/plugins.json)** | 给 CLI、网站或 Agent 使用的结构化元数据和安装命令 |

### 从这些场景开始

| 场景 | 推荐项目 |
| --- | --- |
| **[Better Web UI](./docs/collections.md#better-web-ui)** | [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) · [dsh-focus-chat](https://github.com/dingyi222666/dsh-focus-chat) · [dsh-share](https://github.com/hellodigua/dsh-share) |
| **[Coding essentials](./docs/collections.md#coding-essentials)** | [dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) · [dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) · [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) · [dsh-security-audit](https://github.com/omdsh-dev/dsh-security-audit) |
| **[Research workflow](./docs/collections.md#research-workflow)** | [dsh-deep-research](https://github.com/omdsh-dev/dsh-deep-research) · [dsh-scholar](https://github.com/lzszq/dsh-scholar) |

### 热门可安装插件

> 从检测到 `dsh.bundle.patch` 且许可证明确的项目中，按 GitHub Stars 排序。
> 热度不代表兼容性或安全背书。

| 插件 | 简介 | Stars | License |
| --- | --- | ---: | --- |
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | Agent skill for beautiful, verifiable architecture, workflow, sequence, data-flow, and… | 14151 | MIT |
| [anywhere-labs/deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) | 为 DeepSeek Harness (DSH) 插件生态打造的现代化桌面端解决方案。万物皆「插件」，桌面本身也是「插件」。 | 13364 | MIT |
| [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) | Plugin and skin collection for DeepSeek Harness (DSH) Web UI - task board, git graph, r… | 4511 | Apache-2.0 |
| [strukto-ai/mirage](https://github.com/strukto-ai/mirage) | The World's First Unified Virtual Filesystem For AI Agents | 3504 | Apache-2.0 |
| [liustack/modlens](https://github.com/liustack/modlens) | The first vision plugin for DeepSeek Harness, and the vision bridge for every text-only… | 3057 | MIT |
| [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 开放的侧边栏底座，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/Git/子代理页面 | 2139 | MIT |
| [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | DSH 官方公众号收录的 TUI 补位插件：Claude Code 风，鲸鱼顶栏/实时状态/流式思考/双击 Esc 回滚/上下文进度+TPS。npm 一键装。 DSH off… | 1947 | MIT |
| [alvinunreal/openpets](https://github.com/alvinunreal/openpets) | Local first, desktop companion platform with animated pets, plugin SDK and coding-agent… | 1078 | MIT |
| [agentrq/agentrq](https://github.com/agentrq/agentrq) | AgentRQ: Human-in-loop realtime conversational task manager for AI Agents. Self-hosted!… | 1077 | Apache-2.0 |
| [GanyuanRan/Aegis](https://github.com/GanyuanRan/Aegis) | Make AI coding agents architecture-aware: baseline-first, evidence-verified, drift-chec… | 1054 | MIT |
| [dsh-market/dsh-market](https://github.com/dsh-market/dsh-market) | The plugin market inside DeepSeek Harness — browse, search, one-click install · DSH 可视化… | 1002 | MIT |
| [toby-bridges/api-relay-audit](https://github.com/toby-bridges/api-relay-audit) | Local security audit for AI API relays and LLM proxies: detects prompt injection, model… | 791 | AGPL-3.0 |

[**查看全部 4911 个当前 Bundle 插件 →**](./docs/catalog.md)
<!-- GENERATED:PLUGIN-INDEX:END -->

## 为什么需要 oh-my-dsh？

DeepSeek Harness 采用 “everything is a plugin” 架构，并建议作者添加
[`dsh-plugin`](https://github.com/topics/dsh-plugin) topic。但 topic 只能说明项目希望被发现，不能证明它：

- 包含当前 DSH CLI 能识别的 Bundle；
- 兼容最新 Harness；
- 经过安全审查；
- 拥有清晰的开源许可证。

因此，topic 只用于发现候选。根包声明当前 `dsh.bundle.patch` 时可直接进入结构准入；monorepo workspace 还必须公开发布到 npm，且 npm 仓库元数据指回对应 GitHub 仓库。存在多个有效 workspace 或证据不足时只进入审核队列，不会自动猜测。结构准入仍不等于兼容性或安全认证。

## 安装插件

公共目录中的每个项目都包含建议安装命令：

```sh
npx @deepseek-ai/dsh plugin --profile web add github:owner/repository
```

monorepo workspace 使用经过验证的 npm 包名，例如：

```sh
npx @deepseek-ai/dsh plugin --profile web add @scope/package
```

> [!CAUTION]
> `manifest-detected` 只表示检测到了 `dsh.bundle.patch`，不是兼容性或安全认证。安装第三方插件前，请检查源码、许可证、安装脚本和权限需求。DeepSeek Harness 目前仍处于 Developer Preview，可能发生破坏性变更。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| `manifest-detected` | 根包或已验证 workspace 的 `package.json` 声明了 `dsh.bundle.patch`；仅代表结构检测通过。 |

早期 `dshx` 格式、仅有相关目录结构、仅带 topic、空仓库和归档仓库都不会进入公共目录。

在自动构建或运行测试记录准确的 DeepSeek Harness revision 之前，我们不会使用 “verified compatible”。

## 数据与维护

- [`registry/plugins.json`](./registry/plugins.json)：当前 Bundle 的机器可读 Registry。
- [`registry/candidates.json`](./registry/candidates.json)：待检查及需要人工判断的 monorepo workspace 候选。
- [`registry/inspection-cache.json`](./registry/inspection-cache.json)：按默认分支 HEAD 复用的 workspace 结构检查结果。
- [`docs/catalog.md`](./docs/catalog.md)：自动生成的可安装插件目录。
- [`collections/`](./collections)：人工策划的场景化精选。
- [`registry/overrides.json`](./registry/overrides.json)：分类修正、镜像去重与说明。
- [`.github/workflows/update-registry.yml`](./.github/workflows/update-registry.yml)：每 12 小时自动刷新。

本地刷新需要 Node.js 20+。请先安装依赖，并建议提供 GitHub Token：

```sh
npm install
GITHUB_TOKEN=... npm run update
npm run check
```

更新脚本按仓库创建时间递归切分 GitHub topic 搜索，每个时间片一次完整读取，不以 Stars 决定发现资格。根清单随 GraphQL 发现批量读取；workspace 使用 HEAD 缓存和单次请求预算渐进检查。脚本会生成中英文 README 首页索引、完整目录、公共 Registry 和 workspace 审核队列；校验器会阻止截断发现、重复仓库、失效精选链接、过期 README 和缺少证据的安装命令进入主分支。

## 收录与贡献

插件作者需要在 canonical public repository 上添加 `dsh-plugin` topic，并在根包或公开 npm workspace 的 `package.json` 中声明 `dsh.bundle.patch`。多包仓库可通过 override 明确公共目录应展示的聚合包。分类修正、精选建议和验证能力改进，请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。安全边界见 [SECURITY.md](./SECURITY.md)。

## Roadmap

- [x] GitHub 全量发现与 canonical repository 去重
- [x] 当前 Bundle 清单准入与误标仓库过滤
- [x] 首页索引、全量目录与机器可读 Registry
- [x] 每 12 小时自动刷新和一致性校验
- [ ] 针对准确 DSH revision 的构建兼容矩阵
- [ ] 权限与安装脚本风险信号
- [ ] 可组合、可复现的 Starter Packs

## License

本目录和工具代码采用 [MIT License](./LICENSE)。被索引项目遵循各自的许可证；收录不代表转载或重新授权。

---

如果这个目录帮你发现了好用的插件，欢迎 Star，并把它分享给更多 DSH 用户。🐋
