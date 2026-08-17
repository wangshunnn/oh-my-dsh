import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildEnglishReadmePluginIndex,
  buildReadmePluginIndex,
  packageJsonContentPath,
} from './lib/registry.ts'
import type {
  PluginCollection,
  PluginRegistry,
  PluginKind,
  VerificationMethod,
  VerificationStatus,
  WorkspaceCandidateRegistry,
  WorkspaceCandidateStatus,
  WorkspaceInspectionCache,
  WorkspaceReviewReason,
} from './lib/registry.ts'
import type { RegistryOverrides } from './lib/registry.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures: string[] = []

function assert(condition: unknown, message: string): void {
  if (!condition) failures.push(message)
}

const registry = JSON.parse(
  await readFile(join(root, 'registry/plugins.json'), 'utf8'),
) as PluginRegistry
assert(registry.schemaVersion === 1, 'registry.schemaVersion must be 1')
assert(!Number.isNaN(Date.parse(registry.generatedAt)), 'registry.generatedAt must be an ISO timestamp')
assert(Array.isArray(registry.plugins), 'registry.plugins must be an array')
assert(registry.stats.included === registry.plugins.length, 'stats.included does not match plugin count')
assert(Number.isInteger(registry.source.reportedTotal), 'source.reportedTotal must be an integer')
assert(Number.isInteger(registry.source.discoveredTotal), 'source.discoveredTotal must be an integer')
assert(Number.isInteger(registry.source.slices), 'source.slices must be an integer')
assert(
  Number.isInteger(registry.source.graphqlRequests) && registry.source.graphqlRequests <= 700,
  'source.graphqlRequests must be an integer no greater than 700',
)

const ids = new Set<string>()
const allowedKinds = new Set<PluginKind>(['plugin', 'bundle', 'skin', 'client', 'application', 'collection', 'resource', 'unknown'])
const allowedStatuses = new Set<VerificationStatus>([
  'manifest-detected',
  'legacy-manifest-detected',
  'structure-detected',
  'unverified',
  'placeholder',
  'archived',
])
const allowedMethods = new Set<VerificationMethod>([
  'root-package-manifest',
  'workspace-package-manifest',
  'github-metadata',
])

for (const [index, plugin] of registry.plugins.entries()) {
  const label = `plugins[${index}] (${plugin.id ?? 'missing id'})`
  assert(typeof plugin.id === 'string' && /^[^/]+\/[^/]+$/.test(plugin.id), `${label}: invalid id`)
  assert(!ids.has(plugin.id), `${label}: duplicate id`)
  ids.add(plugin.id)
  assert(plugin.url === `https://github.com/${plugin.id}`, `${label}: URL is not canonical`)
  assert(allowedKinds.has(plugin.kind), `${label}: invalid kind ${plugin.kind}`)
  assert(Array.isArray(plugin.categories) && plugin.categories.length > 0, `${label}: missing categories`)
  assert(allowedStatuses.has(plugin.verification?.status), `${label}: invalid verification status`)
  assert(allowedMethods.has(plugin.verification?.method), `${label}: invalid verification method`)
  assert(plugin.topics?.includes('dsh-plugin'), `${label}: discovery topic missing`)
  assert(Number.isInteger(plugin.metrics?.stars) && plugin.metrics.stars >= 0, `${label}: invalid star count`)

  const manifestDetected = plugin.verification?.status === 'manifest-detected'
  assert(manifestDetected, `${label}: public registry only accepts current Bundle manifests`)
  assert(plugin.install?.available === manifestDetected, `${label}: install availability exceeds evidence`)
  const workspaceManifest = plugin.verification.method === 'workspace-package-manifest'
  assert(
    workspaceManifest === (typeof plugin.package?.path === 'string'),
    `${label}: workspace verification and package path disagree`,
  )
  if (plugin.package?.path !== null) {
    try {
      packageJsonContentPath(plugin.package.path)
    } catch (error) {
      assert(false, `${label}: ${(error as Error).message}`)
    }
  }
  if (plugin.install?.available) {
    assert(plugin.package?.manifest === 'dsh.bundle', `${label}: installable entry lacks dsh.bundle evidence`)
    const expectedSource = plugin.verification.method === 'workspace-package-manifest'
      ? plugin.package.name
      : `github:${plugin.id}`
    assert(plugin.install.source === expectedSource, `${label}: invalid install source`)
    assert(
      plugin.install.command === `npx @deepseek-ai/dsh plugin --profile web add ${expectedSource}`,
      `${label}: invalid install command`,
    )
  }
}

const candidateRegistry = JSON.parse(
  await readFile(join(root, 'registry/candidates.json'), 'utf8'),
) as WorkspaceCandidateRegistry
assert(candidateRegistry.schemaVersion === 1, 'candidates.schemaVersion must be 1')
assert(!Number.isNaN(Date.parse(candidateRegistry.generatedAt)), 'candidates.generatedAt must be an ISO timestamp')
assert(Array.isArray(candidateRegistry.pending), 'candidates.pending must be an array')

const allowedReviewReasons = new Set<WorkspaceReviewReason>([
  'multiple-verified-packages',
  'no-verified-package',
  'tree-truncated',
  'package-limit-exceeded',
])
const allowedCandidateStatuses = new Set<WorkspaceCandidateStatus>([
  'verified',
  'invalid-manifest',
  'unpublished',
  'repository-mismatch',
])
const reviewedRepositories = new Set<string>()
for (const [index, review] of candidateRegistry.reviews.entries()) {
  const label = `reviews[${index}] (${review.repository ?? 'missing repository'})`
  assert(/^[^/]+\/[^/]+$/.test(review.repository), `${label}: invalid repository`)
  assert(!reviewedRepositories.has(review.repository), `${label}: duplicate repository review`)
  reviewedRepositories.add(review.repository)
  assert(allowedReviewReasons.has(review.reason), `${label}: invalid reason ${review.reason}`)
  assert(Array.isArray(review.candidates), `${label}: candidates must be an array`)
  assert(
    review.reason === 'tree-truncated' || review.reason === 'package-limit-exceeded'
      ? review.candidates.length === 0
      : review.candidates.length > 0,
    `${label}: candidate count disagrees with review reason`,
  )
  const candidatePaths = new Set<string>()
  for (const candidate of review.candidates) {
    assert(!candidatePaths.has(candidate.packagePath), `${label}: duplicate package path ${candidate.packagePath}`)
    candidatePaths.add(candidate.packagePath)
    assert(allowedCandidateStatuses.has(candidate.status), `${label}: invalid candidate status ${candidate.status}`)
    try {
      packageJsonContentPath(candidate.packagePath)
    } catch (error) {
      assert(false, `${label}: ${(error as Error).message}`)
    }
  }
  const verifiedCount = review.candidates.filter(candidate => candidate.status === 'verified').length
  if (review.reason === 'multiple-verified-packages') {
    assert(verifiedCount > 1, `${label}: multiple-package review lacks multiple verified packages`)
  }
  if (review.reason === 'no-verified-package') {
    assert(verifiedCount === 0, `${label}: no-package review contains a verified package`)
  }
}

const pendingRepositories = new Set<string>()
for (const repository of candidateRegistry.pending ?? []) {
  assert(/^[^/]+\/[^/]+$/.test(repository), `pending workspace repository is invalid: ${repository}`)
  assert(!pendingRepositories.has(repository), `duplicate pending workspace repository: ${repository}`)
  assert(!reviewedRepositories.has(repository), `workspace repository is both pending and reviewed: ${repository}`)
  pendingRepositories.add(repository)
}

const inspectionCache = JSON.parse(
  await readFile(join(root, 'registry/inspection-cache.json'), 'utf8'),
) as WorkspaceInspectionCache
assert(inspectionCache.schemaVersion === 1, 'inspection-cache.schemaVersion must be 1')
const cachedRepositories = new Set<string>()
for (const [nodeId, entry] of Object.entries(inspectionCache.entries)) {
  const label = `inspection-cache.entries[${nodeId}]`
  assert(nodeId.length > 0, `${label}: empty node id`)
  assert(/^[^/]+\/[^/]+$/.test(entry.repository), `${label}: invalid repository`)
  assert(!cachedRepositories.has(entry.repository), `${label}: duplicate repository`)
  cachedRepositories.add(entry.repository)
  assert(typeof entry.headOid === 'string' && entry.headOid.length > 0, `${label}: invalid HEAD oid`)
  if (entry.packagePath !== null) {
    try {
      packageJsonContentPath(entry.packagePath)
    } catch (error) {
      assert(false, `${label}: ${(error as Error).message}`)
    }
  }
  assert(
    (entry.packageJson === null) === (entry.packagePath === null),
    `${label}: cached package and path disagree`,
  )
}

const overrides = JSON.parse(
  await readFile(join(root, 'registry/overrides.json'), 'utf8'),
) as RegistryOverrides
for (const [id, override] of Object.entries(overrides.repositories ?? {})) {
  if (override.exclude === true) {
    assert(!ids.has(id), `${id}: excluded repository is present in the generated registry`)
  }
  if (override.packagePath !== undefined) {
    try {
      packageJsonContentPath(override.packagePath)
    } catch (error) {
      assert(false, `${id}: ${(error as Error).message}`)
    }
  }
}

const calculatedStatusCounts = Object.fromEntries(
  [...registry.plugins.reduce((map, plugin) => {
    const status = plugin.verification.status
    map.set(status, (map.get(status) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b)),
)
assert(JSON.stringify(calculatedStatusCounts) === JSON.stringify(registry.stats.byStatus), 'stats.byStatus is stale')

const collections: PluginCollection[] = []
for (const filename of ['better-web-ui.json', 'coding-essentials.json', 'research.json']) {
  const path = join(root, 'collections', filename)
  await access(path)
  const collection = JSON.parse(await readFile(path, 'utf8')) as PluginCollection
  collections.push(collection)
  assert(collection.schemaVersion === 1, `${filename}: schemaVersion must be 1`)
  assert(Array.isArray(collection.plugins) && collection.plugins.length > 0, `${filename}: plugins must not be empty`)
  assert(new Set(collection.plugins).size === collection.plugins.length, `${filename}: duplicate plugin ids`)
  for (const id of collection.plugins) {
    assert(ids.has(id), `${filename}: ${id} is missing from the generated registry`)
  }
}

const startMarker = '<!-- GENERATED:PLUGIN-INDEX:START -->'
const endMarker = '<!-- GENERATED:PLUGIN-INDEX:END -->'

for (const [filename, expected] of [
  ['README.md', buildReadmePluginIndex(registry, collections)],
  ['README_EN.md', buildEnglishReadmePluginIndex(registry, collections)],
] as const) {
  const readme = await readFile(join(root, filename), 'utf8')
  const generatedStart = readme.indexOf(startMarker)
  const generatedEnd = readme.indexOf(endMarker)
  assert(
    generatedStart !== -1 && generatedEnd > generatedStart,
    `${filename} plugin index markers are missing or invalid`,
  )
  if (generatedStart !== -1 && generatedEnd > generatedStart) {
    const actual = readme.slice(generatedStart + startMarker.length, generatedEnd).trim()
    assert(actual === expected.trim(), `${filename} plugin index is stale; run npm run update`)
  }
}

if (failures.length > 0) {
  process.stderr.write(`Registry validation failed:\n- ${failures.join('\n- ')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`Registry validation passed for ${registry.plugins.length} entries.\n`)
}
