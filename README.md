# oh-my-dsh

> 🐋 [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) 社区插件索引：自动发现、证据分级、场景精选。

**oh-my-dsh** 帮你更快找到值得尝试的 DSH 插件，并看清它是否真的包含可安装清单、采用什么许可证、验证到了哪一步。

**[浏览全部插件](./docs/catalog.md)** · **[查看场景精选](./docs/collections.md)** · **[使用 JSON Registry](./registry/plugins.json)** · **[提交插件](./CONTRIBUTING.md)**

<sub>Curated, machine-readable plugin discovery for DeepSeek Harness. Discovery evidence is shown separately from compatibility and security claims.</sub>

<!-- GENERATED:PLUGIN-INDEX:START -->
## 插件目录

**已索引 202 个仓库 · 检测到 104 个当前 Bundle 清单 · 识别出 59 个占位仓库**

| 入口 | 适合你在找什么 |
| --- | --- |
| **[浏览全部插件 →](./docs/catalog.md)** | 按类型、分类、状态、Stars 和许可证浏览全量目录 |
| **[查看场景精选 →](./docs/collections.md)** | Coding、Research、Web UI 等开箱方向 |
| **[使用 JSON Registry →](./registry/plugins.json)** | 给 CLI、网站或 Agent 使用的结构化元数据和安装命令 |

### 从这些场景开始

| 场景 | 推荐项目 |
| --- | --- |
| **[Better Web UI](./docs/collections.md#better-web-ui)** | [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) · [dsh-focus-chat](https://github.com/dingyi222666/dsh-focus-chat) · [dsh-web-review](https://github.com/CanglongCl/dsh-web-review) · [dsh-share](https://github.com/hellodigua/dsh-share) |
| **[Coding essentials](./docs/collections.md#coding-essentials)** | [dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) · [dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) · [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) · [dsh-security-audit](https://github.com/omdsh-dev/dsh-security-audit) |
| **[Research workflow](./docs/collections.md#research-workflow)** | [dsh-deep-research](https://github.com/omdsh-dev/dsh-deep-research) · [dsh-scholar](https://github.com/lzszq/dsh-scholar) · [zotero-harvest](https://github.com/Fisfzy/zotero-harvest) |

### 热门可安装候选

> 从检测到 `dsh.bundle.patch` 且许可证明确的项目中，按 GitHub Stars 排序。
> 热度不代表兼容性或安全背书。

| 插件 | 简介 | Stars | License |
| --- | --- | ---: | --- |
| [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等 | 41 | MIT |
| [huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | dsh-tianshu-tui — DeepSeek Harness terminal UI | 33 | Apache-2.0 |
| [ccch1mneyyy/dsh-cc-tui](https://github.com/ccch1mneyyy/dsh-cc-tui) | Claude Code 风格全屏交互终端插件：像素鲸鱼顶栏、流光大字、思考流式展开、双击 Esc 回滚、蓝白上下文进度条 + TPS 仪表 | 27 | BSD-3-Clause |
| [omdsh-dev/dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) | Open DeepSeek Harness workspace directories in VS Code directly from the web GUI. | 22 | MIT |
| [icetomoyo/dsh_workflow](https://github.com/icetomoyo/dsh_workflow) | 把Claude Code的UltraCode模式带给DSH，把 DSH 的一次性多 Agent 调度，升级为可生成、可保存、可治理、可观察、可恢复的 Workflow 层 | 21 | MIT |
| [hust-open-atom-club/oh-dsh-desktop](https://github.com/hust-open-atom-club/oh-dsh-desktop) | Extensible macOS workbench for DeepSeek Harness with a native PTY, workspace tools, liv… | 19 | BSD-3-Clause |
| [omdsh-dev/dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) | Codex-style @file mentions for DeepSeek Harness: search workspace files in the composer… | 19 | MIT |
| [omdsh-dev/dsh-custom-tool](https://github.com/omdsh-dev/dsh-custom-tool) | Create and manage sandboxed JavaScript tools for DeepSeek Harness with a Monaco editor… | 17 | MIT |
| [omdsh-dev/dsh-notification](https://github.com/omdsh-dev/dsh-notification) | Desktop notifications for DeepSeek Harness turn completions, with per-outcome controls… | 17 | MIT |
| [Anionex/dsh-turn-rewind](https://github.com/Anionex/dsh-turn-rewind) | deepseek harness对话回退插件 \| DSH — rewind conversation and workspace state, powered by a pe… | 13 | BSD-3-Clause |
| [ZSeven-W/dsh-openpencil](https://github.com/ZSeven-W/dsh-openpencil) | OpenPencil design preview and editing plugin for DSH | 12 | MIT |
| [bobleer/dsh-acp-for-bitfun](https://github.com/bobleer/dsh-acp-for-bitfun) | BitFun 与 DSH ACP 交互对接 插件 | 8 | MIT |

[**查看全部 202 个索引仓库 →**](./docs/catalog.md)
<!-- GENERATED:PLUGIN-INDEX:END -->

## 为什么需要 oh-my-dsh？

DeepSeek Harness 采用 “everything is a plugin” 架构，并建议作者添加
[`dsh-plugin`](https://github.com/topics/dsh-plugin) topic。但 topic 只能说明项目希望被发现，不能证明它：

- 包含当前 DSH CLI 能识别的 Bundle；
- 兼容最新 Harness；
- 经过安全审查；
- 拥有清晰的开源许可证。

因此，本项目不会把“搜到了”包装成“验证通过”。我们保留每个状态背后的证据，并将插件、皮肤、客户端、集合、资源和空仓库分开呈现。

## 安装插件

完整目录中，只有 `install.available: true` 的项目才会给出建议安装命令：

```sh
npx @deepseek-ai/dsh plugin --profile web add github:owner/repository
```

> [!CAUTION]
> `manifest-detected` 只表示检测到了 `dsh.bundle.patch`，不是兼容性或安全认证。安装第三方插件前，请检查源码、许可证、安装脚本和权限需求。DeepSeek Harness 目前仍处于 Developer Preview，可能发生破坏性变更。

## 状态说明

| 状态 | 含义 |
| --- | --- |
| `manifest-detected` | 根目录 `package.json` 声明了 `dsh.bundle.patch`；仅代表结构检测通过。 |
| `legacy-manifest-detected` | 检测到较早的社区 `dshx` 集成格式。 |
| `structure-detected` | 找到了 DSH 相关结构，但未确认当前可安装 Bundle。 |
| `unverified` | 仅通过 GitHub 元数据发现，尚无更强证据。 |
| `placeholder` | GitHub 返回为空仓库。 |
| `archived` | 仓库已归档。 |

在自动构建或运行测试记录准确的 DeepSeek Harness revision 之前，我们不会使用 “verified compatible”。

## 数据与维护

- [`registry/plugins.json`](./registry/plugins.json)：完整机器可读 Registry。
- [`docs/catalog.md`](./docs/catalog.md)：自动生成的全量插件目录。
- [`collections/`](./collections)：人工策划的场景化精选。
- [`registry/overrides.json`](./registry/overrides.json)：分类修正、镜像去重与说明。
- [`.github/workflows/update-registry.yml`](./.github/workflows/update-registry.yml)：每日自动刷新。

本地刷新需要 Node.js 20+，建议提供 GitHub Token：

```sh
GITHUB_TOKEN=... npm run update
npm run check
```

更新脚本会自动生成 README 首页索引、完整目录和 JSON Registry；校验器会阻止重复仓库、失效精选链接、过期 README 和缺少证据的安装命令进入主分支。

## 收录与贡献

插件作者只需在 canonical public repository 上添加 `dsh-plugin` topic，即可进入自动发现范围。分类修正、精选建议和验证能力改进，请阅读 [CONTRIBUTING.md](./CONTRIBUTING.md)。安全边界见 [SECURITY.md](./SECURITY.md)。

## Roadmap

- [x] GitHub 全量发现与 canonical repository 去重
- [x] Bundle / legacy / placeholder 等证据分级
- [x] 首页索引、全量目录与机器可读 Registry
- [x] 每日自动刷新和一致性校验
- [ ] 针对准确 DSH revision 的构建兼容矩阵
- [ ] 权限与安装脚本风险信号
- [ ] 可组合、可复现的 Starter Packs

## License

本目录和工具代码采用 [MIT License](./LICENSE)。被索引项目遵循各自的许可证；收录不代表转载或重新授权。

---

如果这个目录帮你发现了好用的插件，欢迎 Star，并把它分享给更多 DSH 用户。🐋
