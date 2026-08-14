<p align="center">
  <img src="./assets/oh-my-dsh-banner-v2.jpg" alt="All you need is oh-my-dsh" width="100%">
</p>

<p align="center">
  <sub>简体中文 · <a href="./README_EN.md">English</a></sub>
</p>

> 🐋 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 社区插件目录：topic 发现，Bundle 清单准入。

**oh-my-dsh** 只展示根目录检测到当前 `dsh.bundle.patch` 清单的项目，帮助你搜索、筛选并安装 DSH 插件。

**[访问在线目录](https://soonwang.me/oh-my-dsh/)** · **[浏览全部插件](./docs/catalog.md)** · **[查看场景精选](./docs/collections.md)** · **[使用 JSON Registry](./registry/plugins.json)** · **[提交插件](./CONTRIBUTING.md)**

<sub>只有结构可安装的当前 Bundle 才进入公共目录；收录仍不代表兼容性或安全认证。</sub>

<!-- GENERATED:PLUGIN-INDEX:START -->
## 插件目录

**收录 551 个检测到当前 Bundle 清单的项目**

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
| [liustack/modlens](https://github.com/liustack/modlens) | The first vision plugin for DeepSeek Harness, and the vision bridge for every text-only… | 918 | MIT |
| [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 解决DSH 官方尚无终端 TUI 痛点的补位之作，献给偏爱cli的各位极客：Claude Code 风格全屏交互终端插件——像素鲸鱼顶栏、实时工作状态行、思考流式展开、双击… | 569 | MIT |
| [sandbaseai/sandbase-harness](https://github.com/sandbaseai/sandbase-harness) | Open-source CMA-compatible agent runtime. Run multi-agent systems locally with any mode… | 567 | NOASSERTION |
| [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 一个侧边栏的完整工作台，支持三方拓展注册新Tab页面，内置文件渲染编辑/终端/Git/子代理 | 450 | MIT |
| [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等 | 253 | MIT |
| [hust-open-atom-club/oh-dsh](https://github.com/hust-open-atom-club/oh-dsh) | 一站式 DeepSeek Harness 社区发行版：TUI、桌面端与 Web UI 三种形态统一体验，支持分层安装、一步到位，免去手工整合打包。 | 111 | BSD-3-Clause |
| [huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | dsh-tianshu-tui — DeepSeek Harness terminal UI +harness workflow。是官方 DeepSeek Harness 上… | 99 | Apache-2.0 |
| [vlln/whale-girl](https://github.com/vlln/whale-girl) | DSH Web GUI 桌面宠物插件（QQ 宠物形态）：右下角悬浮、可拖拽/投喂/玩耍的积累型伙伴。官方 repository-plugin（.dsh-plugin 格式），… | 79 | MIT |
| [liustack/modsearch](https://github.com/liustack/modsearch) | The web plugin for DeepSeek Harness, and the search bridge for every text-only coding a… | 76 | MIT |
| [omdsh-dev/dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) | Codex-style @file mentions for DeepSeek Harness: search workspace files in the composer… | 73 | MIT |
| [Jayden-X-L/forkprobe](https://github.com/Jayden-X-L/forkprobe) | Compare multiple skills on the same task and pick the winner. | 63 | MIT |
| [ZSeven-W/dsh-openpencil](https://github.com/ZSeven-W/dsh-openpencil) | OpenPencil design preview and editing plugin for DSH | 50 | MIT |

[**查看全部 551 个当前 Bundle 插件 →**](./docs/catalog.md)
<!-- GENERATED:PLUGIN-INDEX:END -->

## 为什么需要 oh-my-dsh？

DeepSeek Harness 采用 “everything is a plugin” 架构，并建议作者添加
[`dsh-plugin`](https://github.com/topics/dsh-plugin) topic。但 topic 只能说明项目希望被发现，不能证明它：

- 包含当前 DSH CLI 能识别的 Bundle；
- 兼容最新 Harness；
- 经过安全审查；
- 拥有清晰的开源许可证。

因此，topic 只用于发现候选。只有根目录实际声明当前 `dsh.bundle.patch` 的项目才进入公共目录；其他仓库不会展示。结构准入仍不等于兼容性或安全认证。

## 安装插件

公共目录中的每个项目都包含建议安装命令：

```sh
npx @deepseek-ai/dsh plugin --profile web add github:owner/repository
```

> [!CAUTION]
> `manifest-detected` 只表示检测到了 `dsh.bundle.patch`，不是兼容性或安全认证。安装第三方插件前，请检查源码、许可证、安装脚本和权限需求。DeepSeek Harness 目前仍处于 Developer Preview，可能发生破坏性变更。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| `manifest-detected` | 根目录 `package.json` 声明了 `dsh.bundle.patch`；仅代表结构检测通过。 |

早期 `dshx` 格式、仅有相关目录结构、仅带 topic、空仓库和归档仓库都不会进入公共目录。

在自动构建或运行测试记录准确的 DeepSeek Harness revision 之前，我们不会使用 “verified compatible”。

## 数据与维护

- [`registry/plugins.json`](./registry/plugins.json)：当前 Bundle 的机器可读 Registry。
- [`docs/catalog.md`](./docs/catalog.md)：自动生成的可安装插件目录。
- [`collections/`](./collections)：人工策划的场景化精选。
- [`registry/overrides.json`](./registry/overrides.json)：分类修正、镜像去重与说明。
- [`.github/workflows/update-registry.yml`](./.github/workflows/update-registry.yml)：每 8 小时自动刷新。

本地刷新需要 Node.js 20+。请先安装依赖，并建议提供 GitHub Token：

```sh
npm install
GITHUB_TOKEN=... npm run update
npm run check
```

更新脚本会自动生成中英文 README 首页索引、完整目录和 JSON Registry；校验器会阻止重复仓库、失效精选链接、过期 README 和缺少证据的安装命令进入主分支。

## 收录与贡献

插件作者需要在 canonical public repository 上添加 `dsh-plugin` topic，并在根目录 `package.json` 声明 `dsh.bundle.patch`，才会进入公共目录。分类修正、精选建议和验证能力改进，请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。安全边界见 [SECURITY.md](./SECURITY.md)。

## Roadmap

- [x] GitHub 全量发现与 canonical repository 去重
- [x] 当前 Bundle 清单准入与误标仓库过滤
- [x] 首页索引、全量目录与机器可读 Registry
- [x] 每 8 小时自动刷新和一致性校验
- [ ] 针对准确 DSH revision 的构建兼容矩阵
- [ ] 权限与安装脚本风险信号
- [ ] 可组合、可复现的 Starter Packs

## License

本目录和工具代码采用 [MIT License](./LICENSE)。被索引项目遵循各自的许可证；收录不代表转载或重新授权。

---

如果这个目录帮你发现了好用的插件，欢迎 Star，并把它分享给更多 DSH 用户。🐋
