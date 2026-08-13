import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  REGISTRY_SCHEMA_VERSION,
  DISCOVERY_QUERY,
  buildCatalog,
  buildReadmePluginIndex,
  classifyCategories,
  classifyKind,
  collectionMarkdown,
  countBy,
  decodePackageJson,
  detectManifest,
  getGitHubToken,
  githubRequest,
  mapWithConcurrency,
  replaceGeneratedSection,
  verificationStatus,
} from './lib/registry.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const token = getGitHubToken()
const scanTimestamp = new Date().toISOString()

if (!token) {
  process.stderr.write('warning: no GitHub token found; unauthenticated rate limits may interrupt discovery\n')
}

const overrides = JSON.parse(await readFile(join(root, 'registry/overrides.json'), 'utf8'))

async function discoverRepositories() {
  const repositories = []
  let reportedTotal = 0
  for (let page = 1; page <= 10; page += 1) {
    const parameters = new URLSearchParams({
      q: DISCOVERY_QUERY,
      per_page: '100',
      page: String(page),
      sort: 'stars',
      order: 'desc',
    })
    const response = await githubRequest(`/search/repositories?${parameters}`, token)
    reportedTotal = response.total_count
    repositories.push(...response.items)
    if (repositories.length >= Math.min(reportedTotal, 1000) || response.items.length === 0) break
  }
  const uniqueRepositories = [...new Map(
    repositories.map(repository => [repository.full_name, repository]),
  ).values()]
  return { repositories: uniqueRepositories, reportedTotal }
}

function excluded(repository) {
  return overrides.owners?.[repository.owner.login]?.exclude === true
    || overrides.repositories?.[repository.full_name]?.exclude === true
}

async function inspect(repository) {
  const override = overrides.repositories?.[repository.full_name] ?? {}
  let packageJson = null
  if (!repository.archived && repository.size > 0) {
    const ref = encodeURIComponent(repository.default_branch)
    const content = await githubRequest(
      `/repos/${repository.full_name}/contents/package.json?ref=${ref}`,
      token,
    )
    packageJson = decodePackageJson(content)
  }

  const manifest = detectManifest(packageJson)
  const status = verificationStatus(repository, packageJson)
  const installAvailable = status === 'manifest-detected'

  return {
    id: repository.full_name,
    name: repository.name,
    owner: repository.owner.login,
    repository: repository.name,
    url: repository.html_url,
    description: repository.description,
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
    },
    verification: {
      status,
      checkedAt: scanTimestamp,
      method: manifest ? 'root-package-manifest' : 'github-metadata',
      harnessRevision: null,
      runtimeTested: false,
    },
    install: {
      available: installAvailable,
      profile: installAvailable ? 'web' : null,
      source: installAvailable ? `github:${repository.full_name}` : null,
      command: installAvailable
        ? `npx @deepseek-ai/dsh plugin --profile web add github:${repository.full_name}`
        : null,
    },
    ...(Object.keys(override).length > 0 ? {
      curation: {
        note: override.note ?? null,
        canonical: override.canonical ?? true,
      },
    } : {}),
  }
}

const { repositories: discovered, reportedTotal } = await discoverRepositories()
const candidates = discovered.filter(repository => !excluded(repository))
process.stdout.write(`Discovered ${reportedTotal} repositories; inspecting ${candidates.length} canonical candidates...\n`)

const plugins = await mapWithConcurrency(candidates, 8, inspect)
plugins.sort((a, b) => b.metrics.stars - a.metrics.stars || a.id.localeCompare(b.id))

const registry = {
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

const collectionFiles = (await Promise.all([
  'better-web-ui.json',
  'coding-essentials.json',
  'research.json',
].map(async filename => JSON.parse(await readFile(join(root, 'collections', filename), 'utf8')))))

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

await Promise.all([
  mkdir(join(root, 'docs'), { recursive: true }),
  mkdir(join(root, 'registry'), { recursive: true }),
])
await Promise.all([
  writeFile(join(root, 'registry/plugins.json'), `${JSON.stringify(registry, null, 2)}\n`),
  writeFile(join(root, 'docs/catalog.md'), buildCatalog(registry)),
  writeFile(join(root, 'docs/collections.md'), collectionMarkdown(collectionFiles, registry)),
  writeFile(join(root, 'README.md'), renderedReadme),
])

process.stdout.write(
  `Wrote ${plugins.length} entries (${registry.stats.byStatus['manifest-detected'] ?? 0} current bundle manifests detected).\n`,
)
