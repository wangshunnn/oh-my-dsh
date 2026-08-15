<p align="center">
  <a href="https://soonwang.me/oh-my-dsh/">
    <img src="./assets/oh-my-dsh-banner-v2.jpg" alt="All you need is oh-my-dsh" width="100%">
  </a>
</p>

<p align="center">
  <sub><a href="./README.md">简体中文</a> · English</sub>
</p>

> 🐋 A community plugin directory for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): topic discovery, Bundle-manifest admission.

**oh-my-dsh** only displays projects with a detected current `dsh.bundle.patch` and an unambiguous installation source. It supports root packages and npm-owned monorepo workspaces, helping you search, filter, and install DSH plugins.

**[Open the live directory](https://soonwang.me/oh-my-dsh/)** · **[Browse all plugins](./docs/catalog.md)** · **[Explore collections](./docs/collections.md)** · **[Use the JSON registry](./registry/plugins.json)** · **[Submit a plugin](./CONTRIBUTING.md)**

<sub>Only structurally installable current Bundles enter the public directory; inclusion is still not compatibility or security certification.</sub>

<!-- GENERATED:PLUGIN-INDEX:START -->
## Plugin directory

**685 projects with a current Bundle manifest detected**

| Entry point | Best for |
| --- | --- |
| **[Browse all plugins →](./docs/catalog.md)** | Explore installable entries by kind, category, Stars, and license |
| **[Explore collections →](./docs/collections.md)** | Start with curated Coding, Research, and Web UI workflows |
| **[Use the JSON registry →](./registry/plugins.json)** | Consume structured metadata and install commands from a CLI, website, or Agent |

### Start with a use case

| Collection | Recommended projects |
| --- | --- |
| **[Better Web UI](./docs/collections.md#better-web-ui)** | [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) · [dsh-focus-chat](https://github.com/dingyi222666/dsh-focus-chat) · [dsh-share](https://github.com/hellodigua/dsh-share) |
| **[Coding essentials](./docs/collections.md#coding-essentials)** | [dsh-at-file](https://github.com/omdsh-dev/dsh-at-file) · [dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) · [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) · [dsh-security-audit](https://github.com/omdsh-dev/dsh-security-audit) |
| **[Research workflow](./docs/collections.md#research-workflow)** | [dsh-deep-research](https://github.com/omdsh-dev/dsh-deep-research) · [dsh-scholar](https://github.com/lzszq/dsh-scholar) |

### Popular installable plugins

> Ranked by GitHub Stars among projects with a detected `dsh.bundle.patch` and an explicit license.
> Popularity is not a compatibility or security endorsement.

| Plugin | Description | Stars | License |
| --- | --- | ---: | --- |
| [tt-a1i/archify](https://github.com/tt-a1i/archify) | Agent skill for beautiful, verifiable architecture, workflow, sequence, data-flow, and… | 12768 | MIT |
| [strukto-ai/mirage](https://github.com/strukto-ai/mirage) | The World's First Unified Virtual Filesystem For AI Agents | 3434 | Apache-2.0 |
| [zhu1090093659/dsh-web-ui](https://github.com/zhu1090093659/dsh-web-ui) | Plugin and skin collection for DeepSeek Harness (DSH) Web UI - task board, git graph, r… | 2299 | Apache-2.0 |
| [liustack/modlens](https://github.com/liustack/modlens) | The first vision plugin for DeepSeek Harness, and the vision bridge for every text-only… | 1572 | MIT |
| [ccch1mneyyy/dsh-TUI](https://github.com/ccch1mneyyy/dsh-TUI) | 解决DSH 官方尚无终端 TUI 痛点的补位之作，献给偏爱cli的各位极客：Claude Code 风格全屏交互终端插件——像素鲸鱼顶栏、实时工作状态行、思考流式展开、双击… | 1069 | MIT |
| [GanyuanRan/Aegis](https://github.com/GanyuanRan/Aegis) | Make AI coding agents architecture-aware: baseline-first, evidence-verified, drift-chec… | 1014 | MIT |
| [omdsh-dev/DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) | 一个侧边栏的完整工作台，支持三方拓展注册新侧边栏页面。内置文件渲染编辑/终端/Git/子代理 | 939 | MIT |
| [sandbaseai/sandbase-harness](https://github.com/sandbaseai/sandbase-harness) | Open-source CMA-compatible agent runtime for any model, with MCP tools, sandboxed sessi… | 581 | Apache-2.0 |
| [adoresever/graph-memory](https://github.com/adoresever/graph-memory) | Openclaw记忆插件Knowledge Graph + Memory；Knowledge Graph Context Engine for OpenClaw — extr… | 513 | MIT |
| [mnemon-dev/mnemon](https://github.com/mnemon-dev/mnemon) | LLM-supervised persistent memory for AI agents — graph-based recall, cross-session know… | 443 | Apache-2.0 |
| [superdesigndev/treg](https://github.com/superdesigndev/treg) | OpenRouter for agent tools. Join community here: https://discord.gg/6mQYYfFMAn | 412 | NOASSERTION |
| [superdesigndev/superdesign-skill](https://github.com/superdesigndev/superdesign-skill) | The design skill for Claude Code, Cursor and any coding agent. Stop shipping AI-slop UI… | 411 | MIT |

[**View all 685 current Bundle plugins →**](./docs/catalog.md)
<!-- GENERATED:PLUGIN-INDEX:END -->

## Why oh-my-dsh?

DeepSeek Harness follows an “everything is a plugin” architecture and recommends that authors add the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic. A topic makes a project discoverable, but it does not prove that the project:

- contains a Bundle recognized by the current DSH CLI;
- is compatible with the latest Harness release;
- has passed a security review; or
- provides a clear open-source license.

The topic is therefore used only to discover candidates. A root package can pass structural admission by declaring the current `dsh.bundle.patch`. A monorepo workspace must also be published to npm with repository metadata pointing back to the discovered GitHub repository. Multiple valid workspaces and insufficient evidence go to a review queue instead of being guessed. Structural admission is still not compatibility or security certification.

## Installing plugins

Every public directory entry includes a suggested installation command:

```sh
npx @deepseek-ai/dsh plugin --profile web add github:owner/repository
```

Monorepo workspaces use their verified npm package name, for example:

```sh
npx @deepseek-ai/dsh plugin --profile web add @scope/package
```

> [!CAUTION]
> `manifest-detected` only means that a `dsh.bundle.patch` declaration was found. It is not a compatibility or security certification. Review source code, licenses, installation scripts, and requested permissions before installing a third-party plugin. DeepSeek Harness is still in Developer Preview and may introduce breaking changes.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| `manifest-detected` | A root or verified workspace `package.json` declares `dsh.bundle.patch`; this is a structural check only. |

Legacy `dshx` formats, related structure without a current manifest, topic-only repositories, placeholders, and archived repositories do not enter the public directory.

We will not use “verified compatible” until automated builds or runtime tests can record the exact DeepSeek Harness revision they tested.

## Data and maintenance

- [`registry/plugins.json`](./registry/plugins.json): the machine-readable current Bundle registry.
- [`registry/candidates.json`](./registry/candidates.json): monorepo workspace candidates that require review.
- [`docs/catalog.md`](./docs/catalog.md): the generated installable plugin catalog.
- [`collections/`](./collections): manually curated, use-case-based collections.
- [`registry/overrides.json`](./registry/overrides.json): category corrections, mirror deduplication, and notes.
- [`.github/workflows/update-registry.yml`](./.github/workflows/update-registry.yml): the refresh workflow that runs every 8 hours.

Local refreshes require Node.js 20+. Install dependencies and, preferably, provide a GitHub token:

```sh
npm install
GITHUB_TOKEN=... npm run update
npm run check
```

The updater regenerates both README indexes, the full catalog, the public registry, and the workspace review queue. Validation prevents duplicate repositories, broken collection references, stale README sections, and install commands without sufficient evidence from reaching the default branch.

## Inclusion and contributions

Plugin authors must add the `dsh-plugin` topic to the canonical public repository and declare `dsh.bundle.patch` in either the root package or a public npm workspace. Multi-package repositories can use an override to select the aggregate package shown in the public directory. For classification corrections, collection suggestions, and verification improvements, see [CONTRIBUTING.md](./CONTRIBUTING.md). See [SECURITY.md](./SECURITY.md) for the security boundary.

## Roadmap

- [x] GitHub-wide discovery and canonical repository deduplication
- [x] Current Bundle admission and false-positive filtering
- [x] Homepage indexes, full catalog, and machine-readable registry
- [x] Refresh every 8 hours with consistency validation
- [ ] Build compatibility matrix tied to exact DSH revisions
- [ ] Permission and installation-script risk signals
- [ ] Composable and reproducible Starter Packs

## License

The catalog and tooling are released under the [MIT License](./LICENSE). Indexed projects retain their respective licenses; inclusion is not republication or relicensing.

---

If this directory helped you discover a useful plugin, please Star it and share it with more DSH users. 🐋
