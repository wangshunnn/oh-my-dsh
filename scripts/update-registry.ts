import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
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
  GitHubSearchResponse,
  GitHubTreeResponse,
  NpmPackageMetadata,
  PackageJson,
  PluginCollection,
  PluginRegistry,
  RegistryOverrides,
  RegistryPlugin,
  WorkspaceCandidateRegistry,
  WorkspacePackageCandidate,
  WorkspaceReview,
} from './lib/registry.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const token = getGitHubToken()
const scanTimestamp = new Date().toISOString()

if (!token) {
  process.stderr.write('warning: no GitHub token found; unauthenticated rate limits may interrupt discovery\n')
}

const overrides = JSON.parse(
  await readFile(join(root, 'registry/overrides.json'), 'utf8'),
) as RegistryOverrides

async function discoverRepositories(): Promise<{
  repositories: GitHubRepository[]
  reportedTotal: number
}> {
  const repositories: GitHubRepository[] = []
  let reportedTotal = 0
  for (let page = 1; page <= 10; page += 1) {
    const parameters = new URLSearchParams({
      q: DISCOVERY_QUERY,
      per_page: '100',
      page: String(page),
      sort: 'stars',
      order: 'desc',
    })
    const response = await githubRequest<GitHubSearchResponse>(`/search/repositories?${parameters}`, token)
    if (!response) throw new Error('GitHub repository search unexpectedly returned 404')
    reportedTotal = response.total_count
    repositories.push(...response.items)
    if (repositories.length >= Math.min(reportedTotal, 1000) || response.items.length === 0) break
  }
  const uniqueRepositories = [...new Map(
    repositories.map(repository => [repository.full_name, repository]),
  ).values()]
  return { repositories: uniqueRepositories, reportedTotal }
}

function excluded(repository: GitHubRepository): boolean {
  return overrides.owners?.[repository.owner.login]?.exclude === true
    || overrides.repositories?.[repository.full_name]?.exclude === true
}

async function readPackageJson(
  repository: GitHubRepository,
  packagePath?: string,
): Promise<PackageJson | null> {
  const ref = encodeURIComponent(repository.default_branch)
  const contentPath = packageJsonContentPath(packagePath)
  const content = await githubRequest<GitHubContentResponse>(
    `/repos/${repository.full_name}/contents/${contentPath}?ref=${ref}`,
    token,
  )
  return decodePackageJson(content)
}

async function readNpmMetadata(packageName: string): Promise<NpmPackageMetadata | null> {
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(packageName)}`, {
    headers: { Accept: 'application/json', 'User-Agent': 'oh-my-dsh-registry' },
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
  const tree = await githubRequest<GitHubTreeResponse>(
    `/repos/${repository.full_name}/git/trees/${ref}?recursive=1`,
    token,
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
    packageJson: await readPackageJson(repository, packagePath),
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

async function inspect(repository: GitHubRepository): Promise<{
  plugin: RegistryPlugin
  review?: WorkspaceReview
}> {
  const override = overrides.repositories?.[repository.full_name] ?? {}
  let packageJson: PackageJson | null = null
  let packagePath: string | undefined
  let review: WorkspaceReview | undefined
  if (!repository.archived && repository.size > 0) {
    packagePath = override.packagePath
    packageJson = await readPackageJson(repository, packagePath)

    if (packagePath !== undefined) {
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
    } else if (packagePath === undefined && detectManifest(packageJson) !== 'dsh.bundle') {
      const workspace = await inspectWorkspace(repository)
      packageJson = workspace.packageJson ?? packageJson
      packagePath = workspace.packagePath
      review = workspace.review
    }
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
  return { plugin, review }
}

const { repositories: discovered, reportedTotal } = await discoverRepositories()
const candidates = discovered.filter(repository => !excluded(repository))
process.stdout.write(`Discovered ${reportedTotal} repositories; inspecting ${candidates.length} canonical candidates...\n`)

const inspected = await mapWithConcurrency(candidates, 8, inspect)
const plugins = inspected
  .map(result => result.plugin)
  .filter(plugin => plugin.verification.status === 'manifest-detected')
plugins.sort((a, b) => b.metrics.stars - a.metrics.stars || a.id.localeCompare(b.id))

const candidateRegistry: WorkspaceCandidateRegistry = {
  schemaVersion: 1,
  generatedAt: scanTimestamp,
  reviews: inspected
    .flatMap(result => result.review ? [result.review] : [])
    .sort((a, b) => a.repository.localeCompare(b.repository)),
}

const registry: PluginRegistry = {
  schemaVersion: REGISTRY_SCHEMA_VERSION,
  generatedAt: scanTimestamp,
  source: {
    provider: 'github',
    query: DISCOVERY_QUERY,
    url: 'https://github.com/topics/dsh-plugin',
    reportedTotal,
  },
  stats: {
    included: plugins.length,
    byKind: countBy(plugins, 'kind'),
    byStatus: countBy(plugins.map(plugin => ({ status: plugin.verification.status })), 'status'),
  },
  plugins,
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
  writeFile(join(root, 'docs/catalog.md'), buildCatalog(registry)),
  writeFile(join(root, 'docs/collections.md'), collectionMarkdown(collectionFiles, registry)),
  writeFile(join(root, 'README.md'), renderedReadme),
  writeFile(join(root, 'README_EN.md'), renderedEnglishReadme),
])

process.stdout.write(
  `Wrote ${plugins.length} entries (${registry.stats.byStatus['manifest-detected'] ?? 0} current bundle manifests detected) and ${candidateRegistry.reviews.length} workspace reviews.\n`,
)
