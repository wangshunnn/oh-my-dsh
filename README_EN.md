<p align="center">
  <a href="https://oh-my-dsh.vercel.app/">
    <img src="./assets/oh-my-dsh-banner-v2.jpg" alt="All you need is oh-my-dsh" width="100%">
  </a>
</p>

<p align="center">
  <sub><a href="./README.md">简体中文</a> · English</sub>
</p>

> 🐋 A community project directory for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness): discover through a GitHub topic, then read the project at its source.

**oh-my-dsh** indexes public GitHub projects using the [`dsh-plugin`](https://github.com/topics/dsh-plugin) topic and provides search, classification, and curated collections. The directory does not generate one-click installation commands. Open the project repository and follow the maintainer's documentation before installing or granting access.

**[Open the live directory](https://oh-my-dsh.vercel.app/)** · **[Browse all projects](./docs/catalog.md)** · **[Explore collections](./docs/collections.md)** · **[Use the JSON registry](./registry/plugins.json)** · **[Submit a project](./CONTRIBUTING.md)**

<!-- GENERATED:PLUGIN-INDEX:START -->
## Plugin directory

**10468 GitHub projects using the `dsh-plugin` topic**

| Entry point | Best for |
| --- | --- |
| **[Browse all projects →](./docs/catalog.md)** | Explore by kind, category, Stars, and license |
| **[Explore collections →](./docs/collections.md)** | Start with manually curated Coding, Research, and Web UI projects |
| **[Use the JSON registry →](./registry/plugins.json)** | Consume structured GitHub metadata from a website or Agent |

### Start with a use case

| Collection | Recommended projects |
| --- | --- |
| **[Better Web UI](./docs/collections.md#better-web-ui)** | [DSH-better-sidebar](https://github.com/omdsh-dev/DSH-better-sidebar) · [dsh-focus-chat](https://github.com/dingyi222666/dsh-focus-chat) · [dsh-share](https://github.com/hellodigua/dsh-share) |
| **[Coding essentials](./docs/collections.md#coding-essentials)** | [dsh-at-file](https://github.com/FSMargoo/dsh-at-file) · [dsh-open-in-vscode](https://github.com/omdsh-dev/dsh-open-in-vscode) · [dsh-context-doctor](https://github.com/Zhenyu98/dsh-context-doctor) · [dsh-security-audit](https://github.com/omdsh-dev/dsh-security-audit) |
| **[Research workflow](./docs/collections.md#research-workflow)** | [dsh-deep-research](https://github.com/omdsh-dev/dsh-deep-research) · [dsh-scholar](https://github.com/lzszq/dsh-scholar) |

### Popular projects

> Ranked by GitHub Stars. Popularity is not a compatibility or security endorsement.

| Project | Description | Stars | License |
| --- | --- | ---: | --- |
| [deepseek-ai/deepseek-harness](https://github.com/deepseek-ai/deepseek-harness) | DeepSeek Harness: Everything is a Plugin. | 183109 | MIT |
| [nexu-io/open-design](https://github.com/nexu-io/open-design) | 🎨 Best DeepSeek Harness Design Plugin. The open-source Claude Design alternative. 🖥️… | 90280 | Apache-2.0 |
| [ruvnet/ruflo](https://github.com/ruvnet/ruflo) | 🌊 The original agent meta-harness. Deploy intelligent multi-player swarms, coordinate… | 68768 | MIT |
| [amruthpillai/reactive-resume](https://github.com/amruthpillai/reactive-resume) | A one-of-a-kind resume builder that keeps your privacy in mind. Completely secure, cust… | 41488 | MIT |
| [esengine/DeepSeek-Reasonix](https://github.com/esengine/DeepSeek-Reasonix) | DeepSeek-native AI coding agent for your terminal. Engineered around prefix-cache stabi… | 35027 | MIT |
| [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | Self-evolving Context Database for AI Agents. Unify Agent Memory, Knowledge RAG and Ski… | 31817 | AGPL-3.0 |
| [Molunerfinn/PicGo](https://github.com/Molunerfinn/PicGo) | :rocket: The Ultimate Image Uploader for Efficient Creators. Supports Obsidian, Typora,… | 27005 | MIT |
| [titanwings/colleague-skill](https://github.com/titanwings/colleague-skill) | 将冰冷的离别化为温暖的 Skill，欢迎加入数字生命1.0！Transforming cold farewells into warm skills? It's giving… | 23775 | MIT |
| [nocobase/nocobase](https://github.com/nocobase/nocobase) | NocoBase is an open-source AI + no-code platform for building business systems fast. In… | 23755 | NOASSERTION |
| [Tencent/WeKnora](https://github.com/Tencent/WeKnora) | Open-source LLM knowledge platform: turn raw documents into a queryable RAG, an autonom… | 20342 | NOASSERTION |
| [Nagi-ovo/voyager](https://github.com/Nagi-ovo/voyager) | Enhancement suite for Gemini, AI Studio, Claude & ChatGPT — plus a prompt manager for a… | 19778 | GPL-3.0 |
| [anywhere-labs/deepseek-harness-desktop](https://github.com/anywhere-labs/deepseek-harness-desktop) | 为 DeepSeek Harness (DSH) 插件生态打造的现代化桌面端解决方案。万物皆「插件」，桌面本身也是「插件」。 | 17960 | MIT |

[**View all 10468 projects →**](./docs/catalog.md)
<!-- GENERATED:PLUGIN-INDEX:END -->

## Listing rules

The directory automatically includes public, non-fork, non-archived, non-empty repositories using the `dsh-plugin` topic, with no manual exceptions. Root `package.json` signals and Stars are display metadata only. Listing is not compatibility verification, security certification, a maintenance rating, or official endorsement. Installation instructions come from each repository.

Curated collections additionally check deletion, archival, transfers, and topic changes. Ownership changes are never followed silently.

## Data and refresh strategy

- [`registry/plugins.json`](./registry/plugins.json): the machine-readable schema v2 GitHub project directory.
- [`docs/catalog.md`](./docs/catalog.md): the generated full catalog.
- [`collections/`](./collections): manually curated, use-case-based collections.
- [`.github/workflows/update-registry.yml`](./.github/workflows/update-registry.yml): two incremental scans per day and one weekly full reconciliation.

Routine scans use an `updated:` window and merge repositories changed since the last successful scan by stable GitHub node ID, which also handles renames. A weekly full scan removes entries that disappear after topic removal, archival, or deletion and therefore cannot appear in incremental results.

Root `package.json` data and repository metadata arrive in the same GraphQL batch. The updater no longer walks workspaces or contacts the npm Registry. Full scans still partition time ranges to pass GitHub Search's 1,000-result limit; incremental scans normally need very few slices.

Local updates require Node.js 20+:

```sh
npm install
GITHUB_TOKEN=... REGISTRY_SCAN_MODE=incremental npm run update
npm run check
```

The first schema v2 generation automatically falls back to a full scan. Set `REGISTRY_SCAN_MODE=full` to request one explicitly.

## Contributing

Project authors only need to publish a repository, add the `dsh-plugin` topic, and document installation, permissions, and removal in the README. See [CONTRIBUTING.md](./CONTRIBUTING.md) for collection proposals and [SECURITY.md](./SECURITY.md) for the security boundary.

## License

The directory and tooling are released under the [MIT License](./LICENSE). Indexed projects retain their own licenses; listing is not republication, relicensing, or endorsement.
