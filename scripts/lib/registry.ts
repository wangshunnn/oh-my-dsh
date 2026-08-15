import { spawnSync } from 'node:child_process'

export const REGISTRY_SCHEMA_VERSION = 1
export const DISCOVERY_QUERY = 'topic:dsh-plugin'
export const MAX_WORKSPACE_PACKAGE_MANIFESTS = 64

export type ManifestKind = 'dsh.bundle' | 'dshx' | 'dsh-structure'
export type PluginKind = 'plugin' | 'bundle' | 'skin' | 'client' | 'application' | 'collection' | 'resource' | 'unknown'
export type VerificationStatus = 'manifest-detected' | 'legacy-manifest-detected' | 'structure-detected' | 'unverified' | 'placeholder' | 'archived'
export type VerificationMethod = 'root-package-manifest' | 'workspace-package-manifest' | 'github-metadata'
export type WorkspaceCandidateStatus = 'verified' | 'invalid-manifest' | 'unpublished' | 'repository-mismatch'
export type WorkspaceReviewReason = 'multiple-verified-packages' | 'no-verified-package' | 'tree-truncated' | 'package-limit-exceeded'

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
  pushed_at: string
  updated_at: string
}

export interface GitHubSearchResponse {
  total_count: number
  items: GitHubRepository[]
}

export interface GitHubContentResponse {
  type: string
  content?: string
}

export interface GitHubTreeResponse {
  truncated: boolean
  tree: Array<{
    path: string
    type: string
  }>
}

export interface NpmPackageMetadata {
  name?: string
  repository?: string | {
    url?: string
    directory?: string
  }
}

export interface WorkspacePackageCandidate {
  packagePath: string
  packageName: string | null
  status: WorkspaceCandidateStatus
}

export interface WorkspaceReview {
  repository: string
  reason: WorkspaceReviewReason
  candidates: WorkspacePackageCandidate[]
}

export interface WorkspaceCandidateRegistry {
  schemaVersion: number
  generatedAt: string
  reviews: WorkspaceReview[]
}

export interface RepositoryOverride {
  exclude?: boolean
  kind?: PluginKind
  categories?: string[]
  packagePath?: string
  note?: string | null
  canonical?: boolean
}

export interface RegistryOverrides {
  owners?: Record<string, { exclude?: boolean }>
  repositories?: Record<string, RepositoryOverride>
}

export interface RegistryPlugin {
  id: string
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
    archived: boolean
    fork: boolean
    empty: boolean
    defaultBranch: string
    createdAt: string
    pushedAt: string
    updatedAt: string
  }
  package: {
    detected: boolean
    name: string | null
    version: string | null
    private: boolean | null
    manifest: ManifestKind | null
    path: string | null
  }
  verification: {
    status: VerificationStatus
    checkedAt: string
    method: VerificationMethod
    harnessRevision: string | null
    runtimeTested: boolean
  }
  install: {
    available: boolean
    profile: string | null
    source: string | null
    command: string | null
  }
  curation?: {
    note: string | null
    canonical: boolean
  }
}

export interface PluginRegistry {
  schemaVersion: number
  generatedAt: string
  source: {
    provider: string
    query: string
    url: string
    reportedTotal: number
  }
  stats: {
    included: number
    byKind: Record<string, number>
    byStatus: Record<string, number>
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
  if (packageJson?.dsh || packageJson?.files?.includes?.('dsh.plugin.json')) {
    return 'dsh-structure'
  }
  return null
}

export function classifyKind(
  repository: ClassificationRepository,
  packageJson: PackageJson | null,
  override: RepositoryOverride = {},
): PluginKind {
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

export function classifyCategories(
  repository: ClassificationRepository,
  packageJson: PackageJson | null,
  override: RepositoryOverride = {},
): string[] {
  if (override.categories) return [...new Set(override.categories)].sort()
  const text = searchable(repository, packageJson)
  const categories = CATEGORY_RULES
    .filter(([, pattern]) => pattern.test(text))
    .map(([category]) => category)

  return [...new Set(categories.length > 0 ? categories : ['other'])].sort()
}

export function verificationStatus(
  repository: ClassificationRepository,
  packageJson: PackageJson | null,
): VerificationStatus {
  if (repository.archived) return 'archived'
  if (repository.size === 0) return 'placeholder'
  const manifest = detectManifest(packageJson)
  if (manifest === 'dsh.bundle') return 'manifest-detected'
  if (manifest === 'dshx') return 'legacy-manifest-detected'
  if (manifest === 'dsh-structure') return 'structure-detected'
  return 'unverified'
}

export function packageJsonContentPath(packagePath?: unknown): string {
  if (packagePath === undefined) return 'package.json'
  if (typeof packagePath !== 'string') {
    throw new Error('packagePath must be a string')
  }

  const segments = packagePath.split('/')
  if (
    packagePath.trim() !== packagePath
    || packagePath.startsWith('/')
    || packagePath.endsWith('/')
    || packagePath.includes('\\')
    || /[\u0000-\u001f\u007f]/.test(packagePath)
    || segments.some(segment => segment === '' || segment === '.' || segment === '..')
  ) {
    throw new Error(`packagePath must be a normalized relative directory: ${JSON.stringify(packagePath)}`)
  }

  return [...segments, 'package.json'].map(encodeURIComponent).join('/')
}

export function verificationMethod(
  manifest: ManifestKind | null,
  packagePath?: string,
): VerificationMethod {
  if (!manifest) return 'github-metadata'
  return packagePath === undefined ? 'root-package-manifest' : 'workspace-package-manifest'
}

const NPM_PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._~-]*\/)?[a-z0-9][a-z0-9._~-]*$/

export function isPublicPackageManifest(
  packageJson: PackageJson | null,
): packageJson is PackageJson & { name: string } {
  const packageName = packageJson?.name
  return packageJson?.private !== true
    && typeof packageName === 'string'
    && packageName.length <= 214
    && NPM_PACKAGE_NAME.test(packageName)
}

export function installationSource(
  repositoryFullName: string,
  packageJson: PackageJson | null,
  packagePath?: string,
): string {
  if (packagePath === undefined) return `github:${repositoryFullName}`

  if (!isPublicPackageManifest(packageJson)) {
    throw new Error(`${repositoryFullName}: workspace manifest must declare a valid public package.name`)
  }
  return packageJson.name
}

const IGNORED_WORKSPACE_SEGMENTS = new Set([
  '.git',
  '.yarn',
  'node_modules',
  'vendor',
])

export function workspacePackagePaths(
  response: GitHubTreeResponse,
  limit = MAX_WORKSPACE_PACKAGE_MANIFESTS,
): { paths: string[]; reason: 'tree-truncated' | 'package-limit-exceeded' | null } {
  if (response.truncated) return { paths: [], reason: 'tree-truncated' }

  const paths = response.tree
    .filter(entry => entry.type === 'blob' && entry.path.endsWith('/package.json'))
    .map(entry => entry.path.slice(0, -'/package.json'.length))
    .filter(packagePath => {
      const segments = packagePath.split('/')
      return !segments.some(segment => IGNORED_WORKSPACE_SEGMENTS.has(segment.toLowerCase()))
    })
    .sort((a, b) => a.localeCompare(b))

  if (paths.length > limit) return { paths: [], reason: 'package-limit-exceeded' }
  return { paths, reason: null }
}

export function normalizeGitHubRepository(value: unknown): string | null {
  const repository = typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'url' in value
      ? (value as { url?: unknown }).url
      : null
  if (typeof repository !== 'string') return null

  let normalized = repository.trim()
    .replace(/^git\+/, '')
    .replace(/^github:/, '')
    .replace(/^git@github\.com:/, '')

  if (/^(?:https?|git|ssh):\/\//.test(normalized)) {
    try {
      const url = new URL(normalized)
      if (url.hostname.toLowerCase() !== 'github.com') return null
      normalized = url.pathname
    } catch {
      return null
    }
  }

  normalized = normalized.replace(/^\/+|\/+$/g, '').replace(/\.git$/i, '')
  return /^[^/]+\/[^/]+$/.test(normalized) ? normalized.toLowerCase() : null
}

export function verifyWorkspacePackage(
  repositoryFullName: string,
  packageJson: PackageJson | null,
  metadata: NpmPackageMetadata | null,
): WorkspaceCandidateStatus {
  if (!isPublicPackageManifest(packageJson)) return 'invalid-manifest'
  if (!metadata || metadata.name !== packageJson.name) return 'unpublished'
  return normalizeGitHubRepository(metadata.repository) === repositoryFullName.toLowerCase()
    ? 'verified'
    : 'repository-mismatch'
}

export function selectWorkspaceCandidate<T extends { status: WorkspaceCandidateStatus }>(
  candidates: readonly T[],
): { selected: T | null; reason: 'multiple-verified-packages' | 'no-verified-package' | null } {
  const verified = candidates.filter(candidate => candidate.status === 'verified')
  if (verified.length === 1) return { selected: verified[0], reason: null }
  return {
    selected: null,
    reason: verified.length > 1 ? 'multiple-verified-packages' : 'no-verified-package',
  }
}

export function getGitHubToken(): string {
  const environmentToken = process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (environmentToken) return environmentToken.trim()

  const result = spawnSync('gh', ['auth', 'token'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
  return result.status === 0 ? result.stdout.trim() : ''
}

export async function githubRequest<T>(path: string, token: string): Promise<T | null> {
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
  return await response.json() as T
}

export function decodePackageJson(contentResponse: GitHubContentResponse | null): PackageJson | null {
  if (!contentResponse || contentResponse.type !== 'file' || !contentResponse.content) {
    return null
  }
  try {
    const source = Buffer.from(contentResponse.content, 'base64').toString('utf8')
    return JSON.parse(source) as PackageJson
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

  return Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  ).then(() => results)
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
  return String(value ?? '')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
    .trim()
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
    `> Source: [GitHub topic search](${registry.source.url}) · Updated: ${registry.generatedAt}`,
    '',
    'Every included project has a detected current `dsh.bundle.patch` manifest.',
    'This is a structural installation check, not compatibility or security review.',
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

export function buildReadmePluginIndex(
  registry: PluginRegistry,
  collections: PluginCollection[],
): string {
  const byId = new Map(registry.plugins.map(plugin => [plugin.id, plugin]))
  const currentBundles = registry.stats.byStatus['manifest-detected'] ?? 0
  const installable = registry.plugins
    .filter(plugin => plugin.install.available && plugin.license.status === 'detected')
    .slice(0, 12)

  const lines = [
    '## 插件目录',
    '',
    `**收录 ${currentBundles} 个检测到当前 Bundle 清单的项目**`,
    '',
    '| 入口 | 适合你在找什么 |',
    '| --- | --- |',
    '| **[浏览全部插件 →](./docs/catalog.md)** | 按类型、分类、Stars 和许可证浏览可安装目录 |',
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
      .filter((plugin): plugin is RegistryPlugin => plugin !== undefined)
      .map(plugin => `[${plugin.name}](${plugin.url})`)
      .join(' · ')
    const anchor = collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    lines.push(`| **[${collection.title}](./docs/collections.md#${anchor})** | ${links} |`)
  }

  lines.push(
    '',
    '### 热门可安装插件',
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

  lines.push('', `[**查看全部 ${registry.stats.included} 个当前 Bundle 插件 →**](./docs/catalog.md)`, '')
  return lines.join('\n')
}

export function buildEnglishReadmePluginIndex(
  registry: PluginRegistry,
  collections: PluginCollection[],
): string {
  const byId = new Map(registry.plugins.map(plugin => [plugin.id, plugin]))
  const currentBundles = registry.stats.byStatus['manifest-detected'] ?? 0
  const installable = registry.plugins
    .filter(plugin => plugin.install.available && plugin.license.status === 'detected')
    .slice(0, 12)

  const lines = [
    '## Plugin directory',
    '',
    `**${currentBundles} projects with a current Bundle manifest detected**`,
    '',
    '| Entry point | Best for |',
    '| --- | --- |',
    '| **[Browse all plugins →](./docs/catalog.md)** | Explore installable entries by kind, category, Stars, and license |',
    '| **[Explore collections →](./docs/collections.md)** | Start with curated Coding, Research, and Web UI workflows |',
    '| **[Use the JSON registry →](./registry/plugins.json)** | Consume structured metadata and install commands from a CLI, website, or Agent |',
    '',
    '### Start with a use case',
    '',
    '| Collection | Recommended projects |',
    '| --- | --- |',
  ]

  for (const collection of collections) {
    const links = collection.plugins
      .map(id => byId.get(id))
      .filter((plugin): plugin is RegistryPlugin => plugin !== undefined)
      .map(plugin => `[${plugin.name}](${plugin.url})`)
      .join(' · ')
    const anchor = collection.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    lines.push(`| **[${collection.title}](./docs/collections.md#${anchor})** | ${links} |`)
  }

  lines.push(
    '',
    '### Popular installable plugins',
    '',
    '> Ranked by GitHub Stars among projects with a detected `dsh.bundle.patch` and an explicit license.',
    '> Popularity is not a compatibility or security endorsement.',
    '',
    '| Plugin | Description | Stars | License |',
    '| --- | --- | ---: | --- |',
  )

  for (const plugin of installable) {
    lines.push(
      `| [${escapeMarkdown(plugin.id)}](${plugin.url}) | ${escapeMarkdown(compactDescription(plugin.description)) || 'No description provided.'} | ${plugin.metrics.stars} | ${plugin.license.spdx ?? '—'} |`,
    )
  }

  lines.push('', `[**View all ${registry.stats.included} current Bundle plugins →**](./docs/catalog.md)`, '')
  return lines.join('\n')
}

export function replaceGeneratedSection(source: string, name: string, content: string): string {
  const start = `<!-- GENERATED:${name}:START -->`
  const end = `<!-- GENERATED:${name}:END -->`
  const startIndex = source.indexOf(start)
  const endIndex = source.indexOf(end)
  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`Missing or invalid generated section markers for ${name}`)
  }
  return `${source.slice(0, startIndex)}${start}\n${content.trim()}\n${end}${source.slice(endIndex + end.length)}`
}

export function collectionMarkdown(collections: PluginCollection[], registry: PluginRegistry): string {
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
