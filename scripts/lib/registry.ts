import { spawnSync } from 'node:child_process'

export const REGISTRY_SCHEMA_VERSION = 2
export const DISCOVERY_QUERY = 'topic:dsh-plugin fork:false archived:false'

export type ScanMode = 'full' | 'incremental'
export type ManifestKind = 'dsh.bundle' | 'dshx' | 'dsh-structure'
export type ListingEvidence = 'bundle-manifest' | 'legacy-manifest' | 'dsh-structure' | 'topic-only'
export type PluginKind = 'plugin' | 'bundle' | 'skin' | 'client' | 'application' | 'collection' | 'resource' | 'unknown'

export interface PackageJson {
  name?: string
  description?: string
  version?: string
  private?: boolean
  files?: string[]
  dsh?: {
    bundle?: {
      patch?: unknown
    }
    [key: string]: unknown
  }
  dshx?: unknown
}

export interface ClassificationRepository {
  name: string
  description?: string | null
  topics?: string[]
  archived: boolean
  size: number
}

export interface GitHubRepository extends ClassificationRepository {
  node_id: string
  full_name: string
  owner: {
    login: string
  }
  html_url: string
  fork: boolean
  language: string | null
  license: {
    spdx_id: string | null
  } | null
  stargazers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  created_at: string
  pushed_at: string | null
  updated_at: string
  head_oid: string | null
}

export interface RegistryPlugin {
  id: string
  githubNodeId: string
  name: string
  owner: string
  repository: string
  url: string
  description: string | null
  kind: PluginKind
  categories: string[]
  topics: string[]
  language: string | null
  license: {
    spdx: string | null
    status: 'detected' | 'unknown'
  }
  metrics: {
    stars: number
    forks: number
    openIssues: number
  }
  repositoryState: {
    defaultBranch: string
    headOid: string | null
    createdAt: string
    pushedAt: string | null
    updatedAt: string
  }
  package: {
    name: string | null
    version: string | null
    private: boolean | null
    manifest: ManifestKind | null
  }
  evidence: {
    status: ListingEvidence
    checkedAt: string
  }
}

export interface PluginRegistry {
  schemaVersion: number
  generatedAt: string
  source: {
    provider: 'github'
    query: string
    url: string
    mode: ScanMode
    scannedAt: string
    lastFullScanAt: string
    windowStart: string
    windowEnd: string
    reportedTotal: number
    discoveredTotal: number
    slices: number
    graphqlRequests: number
  }
  stats: {
    included: number
    byKind: Record<string, number>
    byEvidence: Record<string, number>
  }
  plugins: RegistryPlugin[]
}

export interface PluginCollection {
  schemaVersion: number
  slug: string
  title: string
  description: string
  plugins: string[]
}

const CATEGORY_RULES: ReadonlyArray<readonly [string, RegExp]> = [
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

function searchable(repository: ClassificationRepository, packageJson: PackageJson | null): string {
  return [
    repository.name,
    repository.description,
    ...(repository.topics ?? []),
    packageJson?.name,
    packageJson?.description,
  ].filter(Boolean).join(' ')
}

export function detectManifest(packageJson: PackageJson | null): ManifestKind | null {
  if (packageJson?.dsh?.bundle?.patch) return 'dsh.bundle'
  if (packageJson?.dshx) return 'dshx'
  if (packageJson?.dsh || packageJson?.files?.includes?.('dsh.plugin.json')) return 'dsh-structure'
  return null
}

export function listingEvidence(packageJson: PackageJson | null): ListingEvidence {
  const manifest = detectManifest(packageJson)
  if (manifest === 'dsh.bundle') return 'bundle-manifest'
  if (manifest === 'dshx') return 'legacy-manifest'
  if (manifest === 'dsh-structure') return 'dsh-structure'
  return 'topic-only'
}

export function classifyKind(
  repository: ClassificationRepository,
  packageJson: PackageJson | null,
): PluginKind {
  const text = searchable(repository, packageJson)
  const manifest = detectManifest(packageJson)
  if (!manifest && /awesome|plugin director(?:y|ies)|plugin ecosystem|leaderboard|curated list|plugin registry/i.test(text)) return 'collection'
  if (/skin|theme|wallpaper|sticker|status label|custom css/i.test(text)) return 'skin'
  if (/desktop|mobile client|terminal ui|\btui\b|workbench/i.test(text)) return 'client'
  if (/template|guide|cookbook|best practices|development resource/i.test(text)) return 'resource'
  if (/plugin collection|plugin suite|bundle/i.test(text) && !manifest) return 'bundle'
  if (manifest || /\bplugin\b|dsh[-_]/i.test(text)) return 'plugin'
  if (/agent|application|platform/i.test(text)) return 'application'
  return 'unknown'
}

export function classifyCategories(
  repository: ClassificationRepository,
  packageJson: PackageJson | null,
): string[] {
  const text = searchable(repository, packageJson)
  const categories = CATEGORY_RULES.filter(([, pattern]) => pattern.test(text)).map(([category]) => category)
  return [...new Set(categories.length > 0 ? categories : ['other'])].sort()
}

export function collectionRepositoryIssue(
  requestedId: string,
  repository: Pick<GitHubRepository, 'full_name' | 'topics' | 'archived' | 'fork' | 'size'> | null,
): string | null {
  if (!repository) return `${requestedId}: repository was not found`
  if (repository.full_name !== requestedId) return `${requestedId}: repository moved or was renamed to ${repository.full_name}`
  if (repository.archived) return `${requestedId}: repository is archived`
  if (repository.fork) return `${requestedId}: repository is a fork`
  if (repository.size === 0) return `${requestedId}: repository is empty`
  if (!repository.topics?.includes('dsh-plugin')) return `${requestedId}: dsh-plugin topic is missing`
  return null
}

export function mergeRegistryPlugins(
  previous: readonly RegistryPlugin[],
  refreshed: readonly RegistryPlugin[],
  removedNodeIds: ReadonlySet<string>,
  mode: ScanMode,
): RegistryPlugin[] {
  if (mode === 'full') return [...refreshed]
  const merged = new Map(previous.map(plugin => [plugin.githubNodeId, plugin]))
  for (const nodeId of removedNodeIds) merged.delete(nodeId)
  for (const plugin of refreshed) merged.set(plugin.githubNodeId, plugin)
  return [...merged.values()]
}

export function getGitHubToken(): string {
  const environmentToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (environmentToken) return environmentToken.trim()
  const result = spawnSync('gh', ['auth', 'token'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
  return result.status === 0 ? result.stdout.trim() : ''
}

const GITHUB_API_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'oh-my-dsh-registry',
  'X-GitHub-Api-Version': '2022-11-28',
}

function retryDelay(response: Response | null, attempt: number): number {
  const retryAfter = Number(response?.headers.get('retry-after'))
  if (Number.isFinite(retryAfter) && retryAfter > 0) return Math.min(retryAfter * 1000, 60_000)
  const base = Math.min(1000 * 2 ** attempt, 30_000)
  return Math.round(base * (0.75 + Math.random() * 0.5))
}

async function githubFetch(url: string, token: string, init: RequestInit = {}, attempts = 5): Promise<Response> {
  let lastError: unknown
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    let response: Response | null = null
    try {
      response = await fetch(url, {
        ...init,
        headers: { ...GITHUB_API_HEADERS, ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init.headers },
        signal: AbortSignal.timeout(60_000),
      })
    } catch (error) {
      lastError = error
      if (attempt === attempts - 1) throw error
      const delay = retryDelay(null, attempt)
      process.stderr.write(`warning: GitHub request failed (${String(error)}); retrying ${attempt + 2}/${attempts} in ${delay}ms\n`)
      await new Promise(resolve => setTimeout(resolve, delay))
      continue
    }
    if (response.ok || response.status === 404) return response
    const detail = (await response.text()).slice(0, 500)
    const retryable = [429, 502, 503, 504].includes(response.status)
      || (response.status === 403 && (response.headers.has('retry-after') || /secondary rate limit|temporarily blocked/i.test(detail)))
    const responseError = new Error(`GitHub API ${response.status} for ${url}: ${detail}`)
    if (!retryable || attempt === attempts - 1) throw responseError
    lastError = responseError
    const delay = retryDelay(response, attempt)
    process.stderr.write(`warning: GitHub API ${response.status}; retrying ${attempt + 2}/${attempts} in ${delay}ms\n`)
    await new Promise(resolve => setTimeout(resolve, delay))
  }
  throw lastError
}

export async function githubRequest<T>(path: string, token: string): Promise<T | null> {
  const response = await githubFetch(`https://api.github.com${path}`, token)
  if (response.status === 404) return null
  return await response.json() as T
}

export async function githubGraphqlRequest<T>(query: string, variables: Record<string, unknown>, token: string): Promise<T> {
  const response = await githubFetch('https://api.github.com/graphql', token, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  })
  const payload = await response.json() as { data?: T; errors?: Array<{ message?: string }> }
  if (!payload.data || payload.errors?.length) {
    const detail = payload.errors?.map(error => error.message ?? 'unknown GraphQL error').join('; ') ?? 'missing GraphQL data'
    throw new Error(`GitHub GraphQL request failed: ${detail}`)
  }
  return payload.data
}

export function decodePackageJsonText(source: string | null | undefined): PackageJson | null {
  if (!source) return null
  try {
    const value = JSON.parse(source) as unknown
    return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as PackageJson : null
  } catch {
    return null
  }
}

export function mapWithConcurrency<T, Result>(
  items: readonly T[],
  limit: number,
  mapper: (item: T, index: number) => Promise<Result>,
): Promise<Result[]> {
  const results = new Array<Result>(items.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++
      results[index] = await mapper(items[index], index)
    }
  }
  return Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker())).then(() => results)
}

export function countBy<Item, Key extends keyof Item>(items: readonly Item[], key: Key): Record<string, number> {
  return Object.fromEntries(
    [...items.reduce((counts, item) => {
      const value = String(item[key])
      counts.set(value, (counts.get(value) ?? 0) + 1)
      return counts
    }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b)),
  )
}

export function escapeMarkdown(value: unknown): string {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ').trim()
}

export function compactDescription(value: unknown, maximum = 88): string {
  const normalized = String(value ?? '')
    .split(/[｜|]\s*(?=[A-Z][A-Za-z\s-]+:|[A-Z][a-z])/u, 1)[0]
    .replace(/\s+/g, ' ')
    .trim()
  if (normalized.length <= maximum) return normalized
  return `${normalized.slice(0, maximum - 1).trimEnd()}…`
}

export function buildCatalog(registry: PluginRegistry): string {
  const lines = [
    '# DSH plugin catalog',
    '',
    '> Generated by `npm run update`. Do not edit this file manually.',
    '>',
    `> Source: [GitHub topic search](${registry.source.url}) · Scanned: ${registry.source.scannedAt}`,
    '',
    'Projects are listed because their GitHub repository uses the `dsh-plugin` topic.',
    'Open each repository and follow its own documentation before installing anything.',
    '',
    '## Snapshot',
    '',
    `- Scan mode: **${registry.source.mode}**`,
    `- Repositories matched in this scan: **${registry.source.discoveredTotal}**`,
    `- Included repositories: **${registry.stats.included}**`,
    `- Discovery slices: **${registry.source.slices}**`,
    `- GraphQL requests: **${registry.source.graphqlRequests}**`,
    ...Object.entries(registry.stats.byEvidence).map(([status, count]) => `- ${status}: **${count}**`),
    '',
    '## Catalog',
    '',
    '| Repository | Kind | Categories | Evidence | Stars | License | Description |',
    '| --- | --- | --- | --- | ---: | --- | --- |',
  ]
  for (const plugin of registry.plugins) {
    lines.push(`| [${escapeMarkdown(plugin.id)}](${plugin.url}) | ${plugin.kind} | ${plugin.categories.join(', ')} | ${plugin.evidence.status} | ${plugin.metrics.stars} | ${plugin.license.spdx ?? '—'} | ${escapeMarkdown(plugin.description) || '—'} |`)
  }
  lines.push('', '## Notes', '',
    '- Evidence is informational and is not compatibility or security verification.',
    '- GitHub stars are discovery metadata, not a quality or safety score.',
    '- Installation instructions come from each repository, not this directory.',
    '')
  return lines.join('\n')
}

function collectionRows(registry: PluginRegistry, collections: PluginCollection[]): string[] {
  const byId = new Map(registry.plugins.map(plugin => [plugin.id, plugin]))
  return collections.map(collection => {
    const links = collection.plugins
      .map(id => byId.get(id))
      .filter((plugin): plugin is RegistryPlugin => plugin !== undefined)
      .map(plugin => `[${plugin.name}](${plugin.url})`)
      .join(' · ')
    const anchor = collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    return `| **[${collection.title}](./docs/collections.md#${anchor})** | ${links} |`
  })
}

function popularProjects(registry: PluginRegistry): RegistryPlugin[] {
  return registry.plugins.filter(plugin => plugin.license.status === 'detected').slice(0, 12)
}

export function buildReadmePluginIndex(registry: PluginRegistry, collections: PluginCollection[]): string {
  const lines = [
    '## 插件目录',
    '',
    `**收录 ${registry.stats.included} 个带有 \`dsh-plugin\` topic 的 GitHub 项目**`,
    '',
    '| 入口 | 适合你在找什么 |',
    '| --- | --- |',
    '| **[浏览全部项目 →](./docs/catalog.md)** | 按类型、分类、Stars 和许可证浏览目录 |',
    '| **[查看场景精选 →](./docs/collections.md)** | Coding、Research、Web UI 等人工精选 |',
    '| **[使用 JSON Registry →](./registry/plugins.json)** | 给网站或 Agent 使用的结构化 GitHub 元数据 |',
    '',
    '### 从这些场景开始',
    '',
    '| 场景 | 推荐项目 |',
    '| --- | --- |',
    ...collectionRows(registry, collections),
    '',
    '### 热门项目',
    '',
    '> 按 GitHub Stars 排序；热度不代表兼容性或安全背书。',
    '',
    '| 项目 | 简介 | Stars | License |',
    '| --- | --- | ---: | --- |',
  ]
  for (const plugin of popularProjects(registry)) {
    lines.push(`| [${escapeMarkdown(plugin.id)}](${plugin.url}) | ${escapeMarkdown(compactDescription(plugin.description)) || '暂无简介'} | ${plugin.metrics.stars} | ${plugin.license.spdx ?? '—'} |`)
  }
  lines.push('', `[**查看全部 ${registry.stats.included} 个项目 →**](./docs/catalog.md)`, '')
  return lines.join('\n')
}

export function buildEnglishReadmePluginIndex(registry: PluginRegistry, collections: PluginCollection[]): string {
  const lines = [
    '## Plugin directory',
    '',
    `**${registry.stats.included} GitHub projects using the \`dsh-plugin\` topic**`,
    '',
    '| Entry point | Best for |',
    '| --- | --- |',
    '| **[Browse all projects →](./docs/catalog.md)** | Explore by kind, category, Stars, and license |',
    '| **[Explore collections →](./docs/collections.md)** | Start with manually curated Coding, Research, and Web UI projects |',
    '| **[Use the JSON registry →](./registry/plugins.json)** | Consume structured GitHub metadata from a website or Agent |',
    '',
    '### Start with a use case',
    '',
    '| Collection | Recommended projects |',
    '| --- | --- |',
    ...collectionRows(registry, collections),
    '',
    '### Popular projects',
    '',
    '> Ranked by GitHub Stars. Popularity is not a compatibility or security endorsement.',
    '',
    '| Project | Description | Stars | License |',
    '| --- | --- | ---: | --- |',
  ]
  for (const plugin of popularProjects(registry)) {
    lines.push(`| [${escapeMarkdown(plugin.id)}](${plugin.url}) | ${escapeMarkdown(compactDescription(plugin.description)) || 'No description provided.'} | ${plugin.metrics.stars} | ${plugin.license.spdx ?? '—'} |`)
  }
  lines.push('', `[**View all ${registry.stats.included} projects →**](./docs/catalog.md)`, '')
  return lines.join('\n')
}

export function replaceGeneratedSection(source: string, name: string, content: string): string {
  const start = `<!-- GENERATED:${name}:START -->`
  const end = `<!-- GENERATED:${name}:END -->`
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) throw new Error(`Missing or invalid generated section markers for ${name}`)
  return `${source.slice(0, startIndex)}${start}\n${content.trim()}\n${end}${source.slice(endIndex + end.length)}`
}

export function collectionMarkdown(collections: PluginCollection[], registry: PluginRegistry): string {
  const byId = new Map(registry.plugins.map(plugin => [plugin.id, plugin]))
  const lines = [
    '# Curated collections',
    '',
    '> Small, manually curated shortlists for common DSH use cases.',
    '> Open each repository and follow its own installation and security guidance.',
    '',
  ]
  for (const collection of collections) {
    lines.push(`## ${collection.title}`, '', collection.description, '')
    for (const id of collection.plugins) {
      const plugin = byId.get(id)
      if (!plugin) continue
      lines.push(`- [${plugin.id}](${plugin.url}) — ${plugin.description ?? 'No description provided.'} _(${plugin.evidence.status})_`)
    }
    lines.push('')
  }
  return lines.join('\n')
}
