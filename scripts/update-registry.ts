import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { discoverRepositories } from './lib/discovery.ts'
import type { DiscoveredRepository } from './lib/discovery.ts'
import {
  REGISTRY_SCHEMA_VERSION,
  DISCOVERY_QUERY,
  buildCatalog,
  buildEnglishReadmePluginIndex,
  buildReadmePluginIndex,
  classifyCategories,
  classifyKind,
  collectionMarkdown,
  countBy,
  decodePackageJson,
  detectManifest,
  getGitHubToken,
  githubRequest,
  installationSource,
  isPublicPackageManifest,
  mapWithConcurrency,
  packageJsonContentPath,
  replaceGeneratedSection,
  selectWorkspaceCandidate,
  verifyWorkspacePackage,
  verificationMethod,
  verificationStatus,
  workspacePackagePaths,
} from './lib/registry.ts'
import type {
  GitHubContentResponse,
  GitHubRepository,
  GitHubTreeResponse,
  NpmPackageMetadata,
  PackageJson,
  PluginCollection,
  PluginRegistry,
  RegistryOverrides,
  RegistryPlugin,
  WorkspaceCandidateRegistry,
  WorkspaceInspectionCache,
  WorkspaceInspectionCacheEntry,
  WorkspacePackageCandidate,
  WorkspaceReview,
} from './lib/registry.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const token = getGitHubToken()
const scanTimestamp = new Date().toISOString()
const workspaceRequestLimit = Number(process.env.WORKSPACE_GITHUB_REQUEST_LIMIT ?? 500)

if (!Number.isInteger(workspaceRequestLimit) || workspaceRequestLimit < 1 || workspaceRequestLimit > 700) {
  throw new Error('WORKSPACE_GITHUB_REQUEST_LIMIT must be an integer between 1 and 700')
}

const overrides = JSON.parse(
  await readFile(join(root, 'registry/overrides.json'), 'utf8'),
) as RegistryOverrides

async function readJsonIfPresent<T>(path: string): Promise<T | null> {
  try {
    return JSON.parse(await readFile(path, 'utf8')) as T
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

const previousRegistry = await readJsonIfPresent<PluginRegistry>(join(root, 'registry/plugins.json'))
const previousCandidateRegistry = await readJsonIfPresent<WorkspaceCandidateRegistry>(
  join(root, 'registry/candidates.json'),
)
const previousWorkspaceCache = await readJsonIfPresent<WorkspaceInspectionCache>(
  join(root, 'registry/inspection-cache.json'),
) ?? { schemaVersion: 1, entries: {} }

class WorkspaceBudgetExceeded extends Error {}

class WorkspaceRequestBudget {
  used = 0

  constructor(readonly limit: number) {}

  async request<T>(path: string): Promise<T | null> {
    if (this.used >= this.limit) throw new WorkspaceBudgetExceeded('Workspace GitHub request budget exhausted')
    this.used += 1
    return await githubRequest<T>(path, token)
  }
}

const workspaceBudget = new WorkspaceRequestBudget(workspaceRequestLimit)

function excluded(repository: GitHubRepository): boolean {
  return overrides.owners?.[repository.owner.login]?.exclude === true
    || overrides.repositories?.[repository.full_name]?.exclude === true
}

async function readWorkspacePackageJson(
  repository: GitHubRepository,
  packagePath: string,
): Promise<PackageJson | null> {
  const ref = encodeURIComponent(repository.default_branch)
  const contentPath = packageJsonContentPath(packagePath)
  const content = await workspaceBudget.request<GitHubContentResponse>(
    `/repos/${repository.full_name}/contents/${contentPath}?ref=${ref}`,
  )
  return decodePackageJson(content)
}

async function readNpmMetadata(packageName: string): Promise<NpmPackageMetadata | null> {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'oh-my-dsh-registry' },
    signal: AbortSignal.timeout(30_000),
  })
  if (response.status === 404) return null
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500)
    throw new Error(`npm registry ${response.status} for ${packageName}: ${detail}`)
  }
  return await response.json() as NpmPackageMetadata
}

async function inspectWorkspace(
  repository: GitHubRepository,
): Promise<{
  packageJson: PackageJson | null
  packagePath?: string
  review?: WorkspaceReview
}> {
  const ref = encodeURIComponent(repository.default_branch)
  const tree = await workspaceBudget.request<GitHubTreeResponse>(
    `/repos/${repository.full_name}/git/trees/${ref}?recursive=1`,
  )
  if (!tree) return { packageJson: null }

  const packageScan = workspacePackagePaths(tree)
  if (packageScan.reason) {
    return {
      packageJson: null,
      review: {
        repository: repository.full_name,
        reason: packageScan.reason,
        candidates: [],
      },
    }
  }

  const manifests = await mapWithConcurrency(packageScan.paths, 4, async packagePath => ({
    packagePath,
    packageJson: await readWorkspacePackageJson(repository, packagePath),
  }))
  const bundleManifests = manifests.filter(({ packageJson }) => detectManifest(packageJson) === 'dsh.bundle')
  if (bundleManifests.length === 0) return { packageJson: null }

  const candidates = await mapWithConcurrency(bundleManifests, 4, async ({ packagePath, packageJson }) => {
    const metadata = isPublicPackageManifest(packageJson)
      ? await readNpmMetadata(packageJson.name)
      : null
    return {
      packagePath,
      packageName: packageJson?.name ?? null,
      packageJson,
      status: verifyWorkspacePackage(repository.full_name, packageJson, metadata),
    }
  })
  const selection = selectWorkspaceCandidate(candidates)
  if (selection.selected) {
    return {
      packageJson: selection.selected.packageJson,
      packagePath: selection.selected.packagePath,
    }
  }

  return {
    packageJson: null,
    review: {
      repository: repository.full_name,
      reason: selection.reason!,
      candidates: candidates.map(({ packagePath, packageName, status }): WorkspacePackageCandidate => ({
        packagePath,
        packageName,
        status,
      })),
    },
  }
}

async function inspectConfiguredWorkspace(
  repository: GitHubRepository,
  packagePath: string,
): Promise<{ packageJson: PackageJson; packagePath: string }> {
  const packageJson = await readWorkspacePackageJson(repository, packagePath)
  if (detectManifest(packageJson) !== 'dsh.bundle') {
    throw new Error(`${repository.full_name}: configured workspace package has no current dsh.bundle manifest`)
  }
  const metadata = isPublicPackageManifest(packageJson)
    ? await readNpmMetadata(packageJson.name)
    : null
  const status = verifyWorkspacePackage(repository.full_name, packageJson, metadata)
  if (status !== 'verified') {
    throw new Error(`${repository.full_name}: configured workspace package failed npm verification (${status})`)
  }
  return { packageJson: packageJson!, packagePath }
}

function compactWorkspacePackage(packageJson: PackageJson | null): PackageJson | null {
  if (!packageJson || detectManifest(packageJson) !== 'dsh.bundle') return null
  return {
    ...(typeof packageJson.name === 'string' ? { name: packageJson.name } : {}),
    ...(typeof packageJson.description === 'string' ? { description: packageJson.description } : {}),
    ...(typeof packageJson.version === 'string' ? { version: packageJson.version } : {}),
    ...(typeof packageJson.private === 'boolean' ? { private: packageJson.private } : {}),
    dsh: { bundle: { patch: true } },
  }
}

function seedFromPreviousPlugin(
  discovered: DiscoveredRepository,
  previous: RegistryPlugin | undefined,
): WorkspaceInspectionCacheEntry | null {
  const repository = discovered.repository
  if (
    !previous
    || previous.verification.method !== 'workspace-package-manifest'
    || previous.repositoryState.pushedAt !== repository.pushed_at
    || previous.package.manifest !== 'dsh.bundle'
    || !previous.package.path
    || !repository.head_oid
  ) return null

  return {
    repository: repository.full_name,
    headOid: repository.head_oid,
    packageJson: {
      ...(previous.package.name ? { name: previous.package.name } : {}),
      ...(previous.package.version ? { version: previous.package.version } : {}),
      ...(previous.package.private !== null ? { private: previous.package.private } : {}),
      dsh: { bundle: { patch: true } },
    },
    packagePath: previous.package.path,
    review: null,
  }
}

function workspacePriority(
  discovered: DiscoveredRepository,
  previous: RegistryPlugin | undefined,
  reviewedRepositories: Set<string>,
  pendingRepositories: Set<string>,
): number {
  const repository = discovered.repository
  if (overrides.repositories?.[repository.full_name]?.packagePath) return 0
  if (previous?.verification.method === 'workspace-package-manifest') return 1
  if (discovered.rootPackageJson?.workspaces !== undefined || discovered.rootPackageJson?.pnpm !== undefined) return 2
  if (reviewedRepositories.has(repository.full_name)) return 3
  if (pendingRepositories.has(repository.full_name)) return 4
  return 5
}

const discovery = await discoverRepositories(
  token,
  scanTimestamp,
  undefined,
  message => process.stdout.write(`${message}\n`),
)
const candidates = discovery.repositories.filter(({ repository }) => !excluded(repository))
process.stdout.write(
  `Discovered ${discovery.discoveredTotal} of ${discovery.reportedTotal} repositories across ${discovery.sliceCount} complete time slices (${discovery.graphqlRequests} GraphQL requests).\n`,
)

const previousPluginsById = new Map(previousRegistry?.plugins.map(plugin => [plugin.id, plugin]) ?? [])
const reviewedRepositories = new Set(previousCandidateRegistry?.reviews.map(review => review.repository) ?? [])
const pendingRepositories = new Set(previousCandidateRegistry?.pending ?? [])
const workspaceEntries = new Map<string, WorkspaceInspectionCacheEntry>()
const workspaceQueue: DiscoveredRepository[] = []

for (const discovered of candidates) {
  const repository = discovered.repository
  const override = overrides.repositories?.[repository.full_name] ?? {}
  const rootBundle = detectManifest(discovered.rootPackageJson) === 'dsh.bundle'
  if (
    repository.archived
    || repository.size === 0
    || !repository.head_oid
    || (rootBundle && override.packagePath === undefined)
  ) continue

  const cached = previousWorkspaceCache.entries[repository.node_id]
  if (cached?.headOid === repository.head_oid) {
    workspaceEntries.set(repository.node_id, { ...cached, repository: repository.full_name })
    continue
  }
  const seeded = seedFromPreviousPlugin(discovered, previousPluginsById.get(repository.full_name))
  if (seeded) {
    workspaceEntries.set(repository.node_id, seeded)
    continue
  }
  workspaceQueue.push(discovered)
}

workspaceQueue.sort((a, b) => {
  const priority = workspacePriority(
    a,
    previousPluginsById.get(a.repository.full_name),
    reviewedRepositories,
    pendingRepositories,
  ) - workspacePriority(
    b,
    previousPluginsById.get(b.repository.full_name),
    reviewedRepositories,
    pendingRepositories,
  )
  return priority || a.repository.full_name.localeCompare(b.repository.full_name)
})
process.stdout.write(
  `Workspace inspection: ${workspaceEntries.size} cached or seeded, ${workspaceQueue.length} queued, ${workspaceRequestLimit} REST requests available.\n`,
)

const pending: string[] = []
for (let index = 0; index < workspaceQueue.length; index += 1) {
  const discovered = workspaceQueue[index]
  const repository = discovered.repository
  const packagePath = overrides.repositories?.[repository.full_name]?.packagePath
  try {
    const result = packagePath
      ? await inspectConfiguredWorkspace(repository, packagePath)
      : await inspectWorkspace(repository)
    workspaceEntries.set(repository.node_id, {
      repository: repository.full_name,
      headOid: repository.head_oid!,
      packageJson: compactWorkspacePackage(result.packageJson),
      packagePath: result.packagePath ?? null,
      review: 'review' in result ? result.review ?? null : null,
    })
    if ((index + 1) % 50 === 0) {
      process.stdout.write(
        `Workspace inspection: ${index + 1}/${workspaceQueue.length} candidates processed, ${workspaceBudget.used}/${workspaceBudget.limit} REST requests used.\n`,
      )
    }
  } catch (error) {
    if (!(error instanceof WorkspaceBudgetExceeded)) throw error
    pending.push(...workspaceQueue.slice(index).map(item => item.repository.full_name))
    break
  }
}

const workspaceCache: WorkspaceInspectionCache = {
  schemaVersion: 1,
  entries: Object.fromEntries(
    [...workspaceEntries.entries()].sort(([, a], [, b]) => a.repository.localeCompare(b.repository)),
  ),
}

function inspect(discovered: DiscoveredRepository): {
  plugin: RegistryPlugin
  review?: WorkspaceReview
} {
  const repository = discovered.repository
  const override = overrides.repositories?.[repository.full_name] ?? {}
  const workspace = workspaceEntries.get(repository.node_id)
  let packageJson = discovered.rootPackageJson
  let packagePath: string | undefined

  if (override.packagePath !== undefined) {
    packageJson = workspace?.packageJson ?? null
    packagePath = workspace?.packagePath ?? undefined
  } else if (workspace?.packageJson) {
    packageJson = workspace.packageJson
    packagePath = workspace.packagePath ?? undefined
  }

  const manifest = detectManifest(packageJson)
  const status = verificationStatus(repository, packageJson)
  const installSource = status === 'manifest-detected'
    ? installationSource(repository.full_name, packageJson, packagePath)
    : null
  const installAvailable = installSource !== null

  const plugin: RegistryPlugin = {
    id: repository.full_name,
    name: repository.name,
    owner: repository.owner.login,
    repository: repository.name,
    url: repository.html_url,
    description: repository.description ?? null,
    kind: classifyKind(repository, packageJson, override),
    categories: classifyCategories(repository, packageJson, override),
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
      archived: repository.archived,
      fork: repository.fork,
      empty: repository.size === 0,
      defaultBranch: repository.default_branch,
      createdAt: repository.created_at,
      pushedAt: repository.pushed_at,
      updatedAt: repository.updated_at,
    },
    package: {
      detected: packageJson !== null,
      name: packageJson?.name ?? null,
      version: packageJson?.version ?? null,
      private: packageJson?.private ?? null,
      manifest,
      path: packagePath ?? null,
    },
    verification: {
      status,
      checkedAt: scanTimestamp,
      method: verificationMethod(manifest, packagePath),
      harnessRevision: null,
      runtimeTested: false,
    },
    install: {
      available: installAvailable,
      profile: installAvailable ? 'web' : null,
      source: installSource,
      command: installAvailable
        ? `npx @deepseek-ai/dsh plugin --profile web add ${installSource}`
        : null,
    },
    ...(Object.keys(override).length > 0 ? {
      curation: {
        note: override.note ?? null,
        canonical: override.canonical ?? true,
      },
    } : {}),
  }
  return { plugin, review: workspace?.review ?? undefined }
}

const inspected = candidates.map(inspect)
const plugins = inspected
  .map(result => result.plugin)
  .filter(plugin => plugin.verification.status === 'manifest-detected')
plugins.sort((a, b) => b.metrics.stars - a.metrics.stars || a.id.localeCompare(b.id))

function pluginWithoutCheckedAt(plugin: RegistryPlugin): RegistryPlugin {
  return {
    ...plugin,
    verification: { ...plugin.verification, checkedAt: '' },
  }
}

for (const plugin of plugins) {
  const previous = previousPluginsById.get(plugin.id)
  if (
    previous
    && JSON.stringify(pluginWithoutCheckedAt(previous)) === JSON.stringify(pluginWithoutCheckedAt(plugin))
  ) {
    plugin.verification.checkedAt = previous.verification.checkedAt
  }
}

const registry: PluginRegistry = {
  schemaVersion: REGISTRY_SCHEMA_VERSION,
  generatedAt: scanTimestamp,
  source: {
    provider: 'github',
    query: DISCOVERY_QUERY,
    url: 'https://github.com/topics/dsh-plugin',
    reportedTotal: discovery.reportedTotal,
    discoveredTotal: discovery.discoveredTotal,
    slices: discovery.sliceCount,
    graphqlRequests: discovery.graphqlRequests,
  },
  stats: {
    included: plugins.length,
    byKind: countBy(plugins, 'kind'),
    byStatus: countBy(plugins.map(plugin => ({ status: plugin.verification.status })), 'status'),
  },
  plugins,
}

const candidateRegistry: WorkspaceCandidateRegistry = {
  schemaVersion: 1,
  generatedAt: scanTimestamp,
  pending: [...new Set(pending)].sort(),
  reviews: inspected
    .flatMap(result => result.review ? [result.review] : [])
    .sort((a, b) => a.repository.localeCompare(b.repository)),
}

function registryWithoutTimestamps(value: PluginRegistry): PluginRegistry {
  return {
    ...value,
    generatedAt: '',
    plugins: value.plugins.map(pluginWithoutCheckedAt),
  }
}

function candidatesWithoutTimestamp(value: WorkspaceCandidateRegistry): WorkspaceCandidateRegistry {
  return { ...value, generatedAt: '' }
}

const registryChanged = !previousRegistry
  || JSON.stringify(registryWithoutTimestamps(previousRegistry)) !== JSON.stringify(registryWithoutTimestamps(registry))
const candidatesChanged = !previousCandidateRegistry
  || JSON.stringify(candidatesWithoutTimestamp({
    ...previousCandidateRegistry,
    pending: previousCandidateRegistry.pending ?? [],
  })) !== JSON.stringify(candidatesWithoutTimestamp(candidateRegistry))

if (!registryChanged && previousRegistry) registry.generatedAt = previousRegistry.generatedAt
if (!candidatesChanged && previousCandidateRegistry) {
  candidateRegistry.generatedAt = previousCandidateRegistry.generatedAt
}

const collectionFiles: PluginCollection[] = (await Promise.all([
  'better-web-ui.json',
  'coding-essentials.json',
  'research.json',
].map(async filename => JSON.parse(
  await readFile(join(root, 'collections', filename), 'utf8'),
) as PluginCollection)))

const pluginIds = new Set(plugins.map(plugin => plugin.id))
const missingCollectionEntries = collectionFiles.flatMap(collection =>
  collection.plugins
    .filter(id => !pluginIds.has(id))
    .map(id => `${collection.slug}: ${id}`),
)
if (missingCollectionEntries.length > 0) {
  throw new Error(`Collections reference repositories outside this registry:\n- ${missingCollectionEntries.join('\n- ')}`)
}

const readme = await readFile(join(root, 'README.md'), 'utf8')
const renderedReadme = replaceGeneratedSection(
  readme,
  'PLUGIN-INDEX',
  buildReadmePluginIndex(registry, collectionFiles),
)
const englishReadme = await readFile(join(root, 'README_EN.md'), 'utf8')
const renderedEnglishReadme = replaceGeneratedSection(
  englishReadme,
  'PLUGIN-INDEX',
  buildEnglishReadmePluginIndex(registry, collectionFiles),
)

await Promise.all([
  mkdir(join(root, 'docs'), { recursive: true }),
  mkdir(join(root, 'registry'), { recursive: true }),
])
await Promise.all([
  writeFile(join(root, 'registry/plugins.json'), `${JSON.stringify(registry, null, 2)}\n`),
  writeFile(join(root, 'registry/candidates.json'), `${JSON.stringify(candidateRegistry, null, 2)}\n`),
  writeFile(join(root, 'registry/inspection-cache.json'), `${JSON.stringify(workspaceCache, null, 2)}\n`),
  writeFile(join(root, 'docs/catalog.md'), buildCatalog(registry)),
  writeFile(join(root, 'docs/collections.md'), collectionMarkdown(collectionFiles, registry)),
  writeFile(join(root, 'README.md'), renderedReadme),
  writeFile(join(root, 'README_EN.md'), renderedEnglishReadme),
])

process.stdout.write(
  `Wrote ${plugins.length} plugin entries, ${candidateRegistry.reviews.length} workspace reviews, and ${candidateRegistry.pending.length} pending workspace inspections (${workspaceBudget.used}/${workspaceBudget.limit} REST requests).\n`,
)
