import { spawnSync } from 'node:child_process'

export const REGISTRY_SCHEMA_VERSION = 1
export const DISCOVERY_QUERY = 'topic:dsh-plugin'

const CATEGORY_RULES = [
  ['accessibility', /accessibility|computer[ -]?use|desktop automation|gui automation/i],
  ['agent-orchestration', /multi[ -]?agent|subagent|agent team|orchestrat|workflow/i],
  ['automation', /automat|schedul|cron|\bloop\b/i],
  ['browser', /browser|webview|web review/i],
  ['coding', /coding|code map|git|vscode|diff|prompt studio|@file/i],
  ['data', /csv|json|schema|statistics|spreadsheet|notebook|data analysis/i],
  ['developer-tools', /debug|diagnostic|doctor|inspect|trace|observab|context/i],
  ['ecosystem', /awesome|directory|registry|leaderboard|marketplace|plugin collection/i],
  ['memory', /memory|mnemon|remember|knowledge graph/i],
  ['research', /research|scholar|paper|literature|zotero/i],
  ['security', /security|permission|approval|audit|sandbox/i],
  ['social', /telegram|feishu|share|notification|remote/i],
  ['tools', /toolkit|\btool\b|calculator|encoding|regex|markdown/i],
  ['visual', /vision|image|ocr|artifact|canvas|visual/i],
  ['web-ui', /web[ -]?(?:ui|gui)|sidebar|panel|skin|theme|wallpaper|composer|conversation|chat/i],
]

function searchable(repository, packageJson) {
  return [
    repository.name,
    repository.description,
    ...(repository.topics ?? []),
    packageJson?.name,
    packageJson?.description,
  ].filter(Boolean).join(' ')
}

export function detectManifest(packageJson) {
  if (packageJson?.dsh?.bundle?.patch) return 'dsh.bundle'
  if (packageJson?.dshx) return 'dshx'
  if (packageJson?.dsh || packageJson?.files?.includes?.('dsh.plugin.json')) {
    return 'dsh-structure'
  }
  return null
}

export function classifyKind(repository, packageJson, override = {}) {
  if (override.kind) return override.kind
  const text = searchable(repository, packageJson)
  const manifest = detectManifest(packageJson)

  if (!manifest && /awesome|plugin director(?:y|ies)|plugin ecosystem|leaderboard|curated list|plugin registry/i.test(text)) {
    return 'collection'
  }
  if (/skin|theme|wallpaper|sticker|status label|custom css/i.test(text)) {
    return 'skin'
  }
  if (/desktop|mobile client|terminal ui|\btui\b|workbench/i.test(text)) {
    return 'client'
  }
  if (/template|guide|cookbook|best practices|development resource/i.test(text)) {
    return 'resource'
  }
  if (/plugin collection|plugin suite|bundle/i.test(text) && !manifest) {
    return 'bundle'
  }
  if (manifest || /\bplugin\b|dsh[-_]/i.test(text)) return 'plugin'
  if (/agent|application|platform/i.test(text)) return 'application'
  return 'unknown'
}

export function classifyCategories(repository, packageJson, override = {}) {
  if (override.categories) return [...new Set(override.categories)].sort()
  const text = searchable(repository, packageJson)
  const categories = CATEGORY_RULES
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category)

  return [...new Set(categories.length > 0 ? categories : ['other'])].sort()
}

export function verificationStatus(repository, packageJson) {
  if (repository.archived) return 'archived'
  if (repository.size === 0) return 'placeholder'
  const manifest = detectManifest(packageJson)
  if (manifest === 'dsh.bundle') return 'manifest-detected'
  if (manifest === 'dshx') return 'legacy-manifest-detected'
  if (manifest === 'dsh-structure') return 'structure-detected'
  return 'unverified'
}

export function getGitHubToken() {
  const environmentToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (environmentToken) return environmentToken.trim()

  const result = spawnSync('gh', ['auth', 'token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return result.status === 0 ? result.stdout.trim() : ''
}

export async function githubRequest(path, token) {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'oh-my-dsh-registry',
      'X-GitHub-Api-Version': '2022-11-28',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (response.status === 404) return null
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500)
    throw new Error(`GitHub API ${response.status} for ${path}: ${detail}`)
  }
  return response.json()
}

export function decodePackageJson(contentResponse) {
  if (!contentResponse || contentResponse.type !== 'file' || !contentResponse.content) {
    return null
  }
  try {
    const source = Buffer.from(contentResponse.content, 'base64').toString('utf8')
    return JSON.parse(source)
  } catch {
    return null
  }
}

export function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length)
  let nextIndex = 0

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await mapper(items[index], index)
    }
  }

  return Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  ).then(() => results)
}

export function countBy(items, key) {
  return Object.fromEntries(
    [...items.reduce((counts, item) => {
      const value = item[key]
      counts.set(value, (counts.get(value) ?? 0) + 1)
      return counts
    }, new Map()).entries()].sort(([a], [b]) => a.localeCompare(b)),
  )
}

export function escapeMarkdown(value) {
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
    .trim()
}

export function compactDescription(value, maximum = 88) {
  const normalized = String(value ?? '')
    .split(/[｜|]\s*(?=[A-Z][A-Za-z\s-]+:|[A-Z][a-z])/u, 1)[0]
    .replace(/\s+/g, ' ')
    .trim()
  if (normalized.length <= maximum) return normalized
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`
}

export function buildCatalog(registry) {
  const lines = [
    '# DSH plugin catalog',
    '',
    '> Generated by `npm run update`. Do not edit this file manually.',
    '>',
    `> Source: [GitHub topic search](${registry.source.url}) · Updated: ${registry.generatedAt}`,
    '',
    'Discovery does not imply compatibility or security review. See the',
    '[status definitions](../README.md#status-vocabulary) before installing anything.',
    '',
    '## Snapshot',
    '',
    `- Included repositories: **${registry.stats.included}**`,
    ...Object.entries(registry.stats.byStatus).map(([status, count]) => `- ${status}: **${count}**`),
    '',
    '## Catalog',
    '',
    '| Repository | Kind | Categories | Status | Stars | License | Description |',
    '| --- | --- | --- | --- | ---: | --- | --- |',
  ]

  for (const plugin of registry.plugins) {
    lines.push(
      `| [${escapeMarkdown(plugin.id)}](${plugin.url}) | ${plugin.kind} | ${plugin.categories.join(', ')} | ${plugin.verification.status} | ${plugin.metrics.stars} | ${plugin.license.spdx ?? '—'} | ${escapeMarkdown(plugin.description) || '—'} |`,
    )
  }

  lines.push('', '## Notes', '',
    '- `manifest-detected` is a structural check only.',
    '- GitHub stars are discovery metadata, not a quality or safety score.',
    '- Prefer canonical repositories; known mirrors are excluded through overrides.',
    '')
  return lines.join('\n')
}

export function buildReadmePluginIndex(registry, collections) {
  const byId = new Map(registry.plugins.map(plugin => [plugin.id, plugin]))
  const currentBundles = registry.stats.byStatus['manifest-detected'] ?? 0
  const placeholders = registry.stats.byStatus.placeholder ?? 0
  const installable = registry.plugins
    .filter(plugin => plugin.install.available && plugin.license.status === 'detected')
    .slice(0, 12)

  const lines = [
    '## 插件目录',
    '',
    `**已索引 ${registry.stats.included} 个仓库 · 检测到 ${currentBundles} 个当前 Bundle 清单 · 识别出 ${placeholders} 个占位仓库**`,
    '',
    '| 入口 | 适合你在找什么 |',
    '| --- | --- |',
    '| **[浏览全部插件 →](./docs/catalog.md)** | 按类型、分类、状态、Stars 和许可证浏览全量目录 |',
    '| **[查看场景精选 →](./docs/collections.md)** | Coding、Research、Web UI 等开箱方向 |',
    '| **[使用 JSON Registry →](./registry/plugins.json)** | 给 CLI、网站或 Agent 使用的结构化元数据和安装命令 |',
    '',
    '### 从这些场景开始',
    '',
    '| 场景 | 推荐项目 |',
    '| --- | --- |',
  ]

  for (const collection of collections) {
    const links = collection.plugins
      .map(id => byId.get(id))
      .filter(Boolean)
      .map(plugin => `[${plugin.name}](${plugin.url})`)
      .join(' · ')
    const anchor = collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    lines.push(`| **[${collection.title}](./docs/collections.md#${anchor})** | ${links} |`)
  }

  lines.push(
    '',
    '### 热门可安装候选',
    '',
    '> 从检测到 `dsh.bundle.patch` 且许可证明确的项目中，按 GitHub Stars 排序。',
    '> 热度不代表兼容性或安全背书。',
    '',
    '| 插件 | 简介 | Stars | License |',
    '| --- | --- | ---: | --- |',
  )

  for (const plugin of installable) {
    lines.push(
      `| [${escapeMarkdown(plugin.id)}](${plugin.url}) | ${escapeMarkdown(compactDescription(plugin.description)) || '暂无简介'} | ${plugin.metrics.stars} | ${plugin.license.spdx ?? '—'} |`,
    )
  }

  lines.push('', `[**查看全部 ${registry.stats.included} 个索引仓库 →**](./docs/catalog.md)`, '')
  return lines.join('\n')
}

export function replaceGeneratedSection(source, name, content) {
  const start = `<!-- GENERATED:${name}:START -->`
  const end = `<!-- GENERATED:${name}:END -->`
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing or invalid generated section markers for ${name}`)
  }
  return `${source.slice(0, startIndex)}${start}\n${content.trim()}\n${end}${source.slice(endIndex + end.length)}`
}

export function collectionMarkdown(collections, registry) {
  const byId = new Map(registry.plugins.map(plugin => [plugin.id, plugin]))
  const lines = [
    '# Curated collections',
    '',
    '> Small, manually curated shortlists for common DSH use cases.',
    '> Inclusion is not a compatibility or security certification.',
    '',
  ]

  for (const collection of collections) {
    lines.push(`## ${collection.title}`, '', collection.description, '')
    for (const id of collection.plugins) {
      const plugin = byId.get(id)
      if (!plugin) continue
      lines.push(
        `- [${plugin.id}](${plugin.url}) — ${plugin.description ?? 'No description provided.'} _(${plugin.verification.status})_`,
      )
    }
    lines.push('')
  }
  return lines.join('\n')
}
