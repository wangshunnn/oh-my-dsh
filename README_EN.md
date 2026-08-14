<p align="right">
  <a href="./README.md">简体中文</a> · <strong>English</strong>
</p>

# oh-my-dsh

> 🐋 A community plugin index for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): automated discovery, evidence-based status, and curated collections.

**oh-my-dsh** helps you find DSH plugins worth exploring and understand whether they include an installable manifest, which license they use, and how far they have been verified.

**[Browse all plugins](./docs/catalog.md)** · **[Explore collections](./docs/collections.md)** · **[Use the JSON registry](./registry/plugins.json)** · **[Submit a plugin](./CONTRIBUTING.md)**

<sub>Discovery evidence is shown separately from compatibility and security claims.</sub>

<!-- GENERATED:PLUGIN-INDEX:START -->
## Plugin directory

**837 repositories indexed · 455 current Bundle manifests detected · 50 placeholder repositories identified**

| Entry point | Best for |
| --- | --- |
| **[Browse all plugins →](./docs/catalog.md)** | Explore the complete catalog by kind, category, status, Stars, and license |
| **[Explore collections →](./docs/collections.md)** | Start with curated Coding, Research, and Web UI workflows |
| **[Use the JSON registry →](./registry/plugins.json)** | Consume structured metadata and install commands from a CLI, website, or Agent |

### Start with a use case

| Collection | Recommended projects |
| --- | --- |
| **[Better Web UI](./docs/collections.md#better-web-ui)** | [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) · [dsh-focus-chat](https://github.com/dingyi222666/dsh-focus-chat) · [dsh-web-review](https://github.com/CanglongCl/dsh-web-review) · [dsh-share](https://github.com/hellodigua/dsh-share) |
| **[Coding essentials](./docs/collections.md#coding-essentials)** | [dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) · [dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) · [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) · [dsh-security-audit](https://github.com/omdsh-dev/dsh-security-audit) |
| **[Research workflow](./docs/collections.md#research-workflow)** | [dsh-deep-research](https://github.com/omdsh-dev/dsh-deep-research) · [dsh-scholar](https://github.com/lzszq/dsh-scholar) · [zotero-harvest](https://github.com/Fisfzy/zotero-harvest) |

### Popular installable candidates

> Ranked by GitHub Stars among projects with a detected `dsh.bundle.patch` and an explicit license.
> Popularity is not a compatibility or security endorsement.

| Plugin | Description | Stars | License |
| --- | --- | ---: | --- |
| [liustack/modlens](https://github.com/liustack/modlens) | The first vision plugin for DeepSeek Harness, and the vision bridge for every text-only… | 795 | MIT |
| [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 解决DSH 官方尚无终端 TUI 痛点的补位之作，献给偏爱cli的各位极客：Claude Code 风格全屏交互终端插件——像素鲸鱼顶栏、实时工作状态行、思考流式展开、双击… | 359 | BSD-3-Clause |
| [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 一个侧边栏的完整工作台，支持三方拓展注册新Tab页面，内置文件渲染编辑/终端/Git/子代理 | 275 | MIT |
| [Anionex/dsh-vision-toolkit](https://github.com/Anionex/dsh-vision-toolkit) | 让纯文本模型更好地做视觉任务的DeepSeek Harness插件：带意图的图片问答、长截图 OCR、UI 还原等 | 203 | MIT |
| [huiliyi37/dsh-tianshu-tui](https://github.com/huiliyi37/dsh-tianshu-tui) | dsh-tianshu-tui — DeepSeek Harness terminal UI +harness workflow。是官方 DeepSeek Harness 上… | 83 | Apache-2.0 |
| [hust-open-atom-club/oh-dsh](https://github.com/hust-open-atom-club/oh-dsh) | 一站式 DeepSeek Harness 社区发行版：TUI、桌面端与 Web UI 三种形态统一体验，支持分层安装、一步到位，免去手工整合打包。 | 81 | BSD-3-Clause |
| [liustack/modsearch](https://github.com/liustack/modsearch) | The web plugin for DeepSeek Harness, and the search bridge for every text-only coding a… | 66 | MIT |
| [omdsh-dev/dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) | Codex-style @file mentions for DeepSeek Harness: search workspace files in the composer… | 49 | MIT |
| [vlln/whale-girl](https://github.com/vlln/whale-girl) | DSH Web GUI 桌面宠物插件（QQ 宠物形态）：右下角悬浮、可拖拽/投喂/玩耍的积累型伙伴。官方 repository-plugin（.dsh-plugin 格式），… | 40 | MIT |
| [ZSeven-W/dsh-openpencil](https://github.com/ZSeven-W/dsh-openpencil) | OpenPencil design preview and editing plugin for DSH | 40 | MIT |
| [icetomoyo/dsh_workflow](https://github.com/icetomoyo/dsh_workflow) | 把Claude Code的UltraCode模式带给DSH，把 DSH 的一次性多 Agent 调度，升级为可生成、可保存、可治理、可观察、可恢复的 Workflow 层 | 39 | MIT |
| [omdsh-dev/dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) | Open DeepSeek Harness workspace directories in VS Code directly from the web GUI. | 34 | MIT |

[**View all 837 indexed repositories →**](./docs/catalog.md)
<!-- GENERATED:PLUGIN-INDEX:END -->

## Why oh-my-dsh?

DeepSeek Harness follows an “everything is a plugin” architecture and recommends that authors add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic. A topic makes a project discoverable, but it does not prove that the project:

- contains a Bundle recognized by the current DSH CLI;
- is compatible with the latest Harness release;
- has passed a security review; or
- provides a clear open-source license.

This project therefore never presents “discovered” as “verified.” We preserve the evidence behind every status and distinguish plugins, skins, clients, bundles, resources, collections, and empty repositories.

## Installing plugins

Only entries with `install.available: true` include a suggested installation command in the full catalog:

```sh
npx @deepseek-ai/dsh plugin --profile web add github:owner/repository
```

> [!CAUTION]
> `manifest-detected` only means that a `dsh.bundle.patch` declaration was found. It is not a compatibility or security certification. Review source code, licenses, installation scripts, and requested permissions before installing a third-party plugin. DeepSeek Harness is still in Developer Preview and may introduce breaking changes.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `manifest-detected` | The root `package.json` declares `dsh.bundle.patch`; this is a structural check only. |
| `legacy-manifest-detected` | An earlier community `dshx` integration format was detected. |
| `structure-detected` | DSH-related structure was found, but a current installable Bundle was not confirmed. |
| `unverified` | Discovered through GitHub metadata only; no stronger evidence is available yet. |
| `placeholder` | GitHub reports an empty repository. |
| `archived` | The repository has been archived. |

We will not use “verified compatible” until automated builds or runtime tests can record the exact DeepSeek Harness revision they tested.

## Data and maintenance

- [`registry/plugins.json`](./registry/plugins.json): the complete machine-readable registry.
- [`docs/catalog.md`](./docs/catalog.md): the generated full plugin catalog.
- [`collections/`](./collections): manually curated, use-case-based collections.
- [`registry/overrides.json`](./registry/overrides.json): category corrections, mirror deduplication, and notes.
- [`.github/workflows/update-registry.yml`](./.github/workflows/update-registry.yml): the daily refresh workflow.

Local refreshes require Node.js 20+. Install dependencies and, preferably, provide a GitHub token:

```sh
npm install
GITHUB_TOKEN=... npm run update
npm run check
```

The updater regenerates both README indexes, the full catalog, and the JSON registry. Validation prevents duplicate repositories, broken collection references, stale README sections, and install commands without sufficient evidence from reaching the default branch.

## Inclusion and contributions

Plugin authors only need to add the `dsh-plugin` topic to the canonical public repository to enter automated discovery. For classification corrections, collection suggestions, and verification improvements, see [CONTRIBUTING.md](./CONTRIBUTING.md). See [SECURITY.md](./SECURITY.md) for the security boundary.

## Roadmap

- [x] GitHub-wide discovery and canonical repository deduplication
- [x] Evidence-based Bundle, legacy, placeholder, and other statuses
- [x] Homepage indexes, full catalog, and machine-readable registry
- [x] Daily refresh and consistency validation
- [ ] Build compatibility matrix tied to exact DSH revisions
- [ ] Permission and installation-script risk signals
- [ ] Composable and reproducible Starter Packs

## License

The catalog and tooling are released under the [MIT License](./LICENSE). Indexed projects retain their respective licenses; inclusion is not republication or relicensing.

---

If this directory helped you discover a useful plugin, please Star it and share it with more DSH users. 🐋
