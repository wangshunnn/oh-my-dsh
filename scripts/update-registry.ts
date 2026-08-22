import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverRepositories } from './lib/discovery.ts'
import {
  REGISTRY_SCHEMA_VERSION,
  DISCOVERY_QUERY,
  buildCatalog,
  buildEnglishReadmePluginIndex,
  buildReadmePluginIndex,
  classifyCategories,
  classifyKind,
  collectionMarkdown,
  collectionRepositoryIssue,
  countBy,
  detectManifest,
  getGitHubToken,
  githubRequest,
  listingEvidence,
  mapWithConcurrency,
  mergeRegistryPlugins,
  replaceGeneratedSection,
} from './lib/registry.ts'
import type {
  GitHubRepository,
  PluginCollection,
  PluginRegistry,
  RegistryPlugin,
  ScanMode,
} from './lib/registry.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const token = getGitHubToken()
const scanTimestamp = new Date().toISOString()
const modeArgument = process.argv.find(argument => argument === '--full' || argument === '--incremental')
const requestedMode = modeArgument?.slice(2) ?? process.env.REGISTRY_SCAN_MODE ?? 'incremental'

if (!token) throw new Error('Registry updates require GITHUB_TOKEN or GH_TOKEN')
if (requestedMode !== 'full' && requestedMode !== 'incremental') {
  throw new Error('REGISTRY_SCAN_MODE must be full or incremental')
}

async function readJsonIfPresent<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

const previousRegistry = await readJsonIfPresent<PluginRegistry>(join(root, 'registry/plugins.json'))
const mode: ScanMode = requestedMode === 'incremental' && previousRegistry?.schemaVersion === REGISTRY_SCHEMA_VERSION
  ? 'incremental'
  : 'full'

if (requestedMode !== mode) {
  process.stdout.write(`No schema v${REGISTRY_SCHEMA_VERSION} baseline found; falling back to a full scan.\n`)
}

const collectionFilenames = ['better-web-ui.json', 'coding-essentials.json', 'research.json']
const collections = await Promise.all(collectionFilenames.map(async filename => JSON.parse(
  await readFile(join(root, 'collections', filename), 'utf8'),
) as PluginCollection))

async function preflightCollections(): Promise<void> {
  const ids = [...new Set(collections.flatMap(collection => collection.plugins))]
  const issues = (await mapWithConcurrency(ids, 4, async id => {
    const repository = await githubRequest<GitHubRepository>(`/repos/${id}`, token)
    return collectionRepositoryIssue(id, repository)
  })).filter((issue): issue is string => issue !== null)
  if (issues.length > 0) {
    throw new Error(`Curated collection preflight failed:\n- ${issues.join('\n- ')}`)
  }
  process.stdout.write(`Curated collection preflight passed for ${ids.length} repositories.\n`)
}

await preflightCollections()

const discovery = await discoverRepositories(token, {
  scanTimestamp,
  mode,
  ...(mode === 'incremental' ? { since: previousRegistry!.source.scannedAt } : {}),
  reportProgress: message => process.stdout.write(`${message}\n`),
})

function eligible(repository: GitHubRepository): boolean {
  return !repository.archived
    && !repository.fork
    && repository.size > 0
    && repository.topics?.includes('dsh-plugin') === true
}

function toPlugin(repository: GitHubRepository, packageJson: Parameters<typeof detectManifest>[0]): RegistryPlugin {
  return {
    id: repository.full_name,
    githubNodeId: repository.node_id,
    name: repository.name,
    owner: repository.owner.login,
    repository: repository.name,
    url: repository.html_url,
    description: repository.description ?? null,
    kind: classifyKind(repository, packageJson),
    categories: classifyCategories(repository, packageJson),
    topics: [...new Set(repository.topics ?? [])].sort(),
    language: repository.language,
    license: {
      spdx: repository.license?.spdx_id ?? null,
      status: repository.license ? 'detected' : 'unknown',
    },
    metrics: {
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      openIssues: repository.open_issues_count,
    },
    repositoryState: {
      defaultBranch: repository.default_branch,
      headOid: repository.head_oid,
      createdAt: repository.created_at,
      pushedAt: repository.pushed_at,
      updatedAt: repository.updated_at,
    },
    package: {
      name: packageJson?.name ?? null,
      version: packageJson?.version ?? null,
      private: packageJson?.private ?? null,
      manifest: detectManifest(packageJson),
    },
    evidence: {
      status: listingEvidence(packageJson),
      checkedAt: scanTimestamp,
    },
  }
}

const refreshed: RegistryPlugin[] = []
const removedNodeIds = new Set<string>()
for (const discovered of discovery.repositories) {
  if (eligible(discovered.repository)) {
    refreshed.push(toPlugin(discovered.repository, discovered.rootPackageJson))
  } else {
    removedNodeIds.add(discovered.repository.node_id)
  }
}

const plugins = mergeRegistryPlugins(
  previousRegistry?.schemaVersion === REGISTRY_SCHEMA_VERSION ? previousRegistry.plugins : [],
  refreshed,
  removedNodeIds,
  mode,
)

plugins.sort((a, b) => b.metrics.stars - a.metrics.stars || a.id.localeCompare(b.id))

const registry: PluginRegistry = {
  schemaVersion: REGISTRY_SCHEMA_VERSION,
  generatedAt: scanTimestamp,
  source: {
    provider: 'github',
    query: DISCOVERY_QUERY,
    url: 'https://github.com/topics/dsh-plugin',
    mode,
    scannedAt: scanTimestamp,
    lastFullScanAt: mode === 'full' ? scanTimestamp : previousRegistry!.source.lastFullScanAt,
    windowStart: discovery.windowStart,
    windowEnd: discovery.windowEnd,
    reportedTotal: discovery.reportedTotal,
    discoveredTotal: discovery.discoveredTotal,
    slices: discovery.sliceCount,
    graphqlRequests: discovery.graphqlRequests,
  },
  stats: {
    included: plugins.length,
    byKind: countBy(plugins, 'kind'),
    byEvidence: countBy(plugins.map(plugin => ({ status: plugin.evidence.status })), 'status'),
  },
  plugins,
}

const pluginIds = new Set(plugins.map(plugin => plugin.id))
const missingCollectionEntries = collections.flatMap(collection => collection.plugins
  .filter(id => !pluginIds.has(id))
  .map(id => `${collection.slug}: ${id}`))
if (missingCollectionEntries.length > 0) {
  throw new Error(`Collections reference repositories outside this registry:\n- ${missingCollectionEntries.join('\n- ')}`)
}

const readme = await readFile(join(root, 'README.md'), 'utf8')
const englishReadme = await readFile(join(root, 'README_EN.md'), 'utf8')
const renderedReadme = replaceGeneratedSection(readme, 'PLUGIN-INDEX', buildReadmePluginIndex(registry, collections))
const renderedEnglishReadme = replaceGeneratedSection(englishReadme, 'PLUGIN-INDEX', buildEnglishReadmePluginIndex(registry, collections))

await Promise.all([
  mkdir(join(root, 'docs'), { recursive: true }),
  mkdir(join(root, 'registry'), { recursive: true }),
])
await Promise.all([
  writeFile(join(root, 'registry/plugins.json'), `${JSON.stringify(registry, null, 2)}\n`),
  writeFile(join(root, 'docs/catalog.md'), buildCatalog(registry)),
  writeFile(join(root, 'docs/collections.md'), collectionMarkdown(collections, registry)),
  writeFile(join(root, 'README.md'), renderedReadme),
  writeFile(join(root, 'README_EN.md'), renderedEnglishReadme),
])

process.stdout.write(
  `Wrote ${plugins.length} topic-listed projects from a ${mode} scan (${discovery.discoveredTotal} matched, ${discovery.graphqlRequests} GraphQL requests).\n`,
)
