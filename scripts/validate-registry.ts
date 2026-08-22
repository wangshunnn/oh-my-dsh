import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  DISCOVERY_QUERY,
  REGISTRY_SCHEMA_VERSION,
  buildEnglishReadmePluginIndex,
  buildReadmePluginIndex,
} from './lib/registry.ts'
import type {
  ListingEvidence,
  PluginCollection,
  PluginKind,
  PluginRegistry,
} from './lib/registry.ts'

const root = fileURLToPath(new URL('..', import.meta.url))
const failures: string[] = []

function assert(condition: unknown, message: string): void {
  if (!condition) failures.push(message)
}

const registry = JSON.parse(
  await readFile(join(root, 'registry/plugins.json'), 'utf8'),
) as PluginRegistry

assert(registry.schemaVersion === REGISTRY_SCHEMA_VERSION, `registry.schemaVersion must be ${REGISTRY_SCHEMA_VERSION}`)
assert(!Number.isNaN(Date.parse(registry.generatedAt)), 'registry.generatedAt must be an ISO timestamp')
assert(registry.source.provider === 'github', 'source.provider must be github')
assert(registry.source.query === DISCOVERY_QUERY, 'source.query is stale')
assert(registry.source.mode === 'full' || registry.source.mode === 'incremental', 'source.mode is invalid')
for (const field of ['scannedAt', 'lastFullScanAt', 'windowStart', 'windowEnd'] as const) {
  assert(!Number.isNaN(Date.parse(registry.source[field])), `source.${field} must be an ISO timestamp`)
}
assert(Date.parse(registry.source.windowStart) <= Date.parse(registry.source.windowEnd), 'source scan window is reversed')
assert(Array.isArray(registry.plugins), 'registry.plugins must be an array')
assert(registry.stats.included === registry.plugins.length, 'stats.included does not match plugin count')
for (const field of ['reportedTotal', 'discoveredTotal', 'slices', 'graphqlRequests'] as const) {
  assert(Number.isInteger(registry.source[field]) && registry.source[field] >= 0, `source.${field} must be a non-negative integer`)
}
assert(registry.source.graphqlRequests <= 700, 'source.graphqlRequests must not exceed 700')

const allowedKinds = new Set<PluginKind>(['plugin', 'bundle', 'skin', 'client', 'application', 'collection', 'resource', 'unknown'])
const allowedEvidence = new Set<ListingEvidence>(['bundle-manifest', 'legacy-manifest', 'dsh-structure', 'topic-only'])
const evidenceByManifest = new Map([
  ['dsh.bundle', 'bundle-manifest'],
  ['dshx', 'legacy-manifest'],
  ['dsh-structure', 'dsh-structure'],
  [null, 'topic-only'],
])
const ids = new Set<string>()
const nodeIds = new Set<string>()

for (const [index, plugin] of registry.plugins.entries()) {
  const label = `plugins[${index}] (${plugin.id ?? 'missing id'})`
  assert(typeof plugin.id === 'string' && /^[^/]+\/[^/]+$/.test(plugin.id), `${label}: invalid id`)
  assert(!ids.has(plugin.id), `${label}: duplicate id`)
  ids.add(plugin.id)
  assert(typeof plugin.githubNodeId === 'string' && plugin.githubNodeId.length > 0, `${label}: missing GitHub node id`)
  assert(!nodeIds.has(plugin.githubNodeId), `${label}: duplicate GitHub node id`)
  nodeIds.add(plugin.githubNodeId)
  assert(plugin.url === `https://github.com/${plugin.id}`, `${label}: URL is not canonical`)
  assert(plugin.owner === plugin.id.split('/')[0], `${label}: owner disagrees with id`)
  assert(plugin.repository === plugin.id.split('/')[1], `${label}: repository disagrees with id`)
  assert(allowedKinds.has(plugin.kind), `${label}: invalid kind ${plugin.kind}`)
  assert(Array.isArray(plugin.categories) && plugin.categories.length > 0, `${label}: missing categories`)
  assert(Array.isArray(plugin.topics) && plugin.topics.includes('dsh-plugin'), `${label}: discovery topic missing`)
  assert(Number.isInteger(plugin.metrics?.stars) && plugin.metrics.stars >= 0, `${label}: invalid star count`)
  assert(allowedEvidence.has(plugin.evidence?.status), `${label}: invalid evidence status`)
  assert(!Number.isNaN(Date.parse(plugin.evidence?.checkedAt)), `${label}: evidence.checkedAt must be an ISO timestamp`)
  assert(evidenceByManifest.get(plugin.package?.manifest) === plugin.evidence?.status, `${label}: package manifest and evidence disagree`)
  assert(!('install' in plugin), `${label}: deprecated install metadata is present`)
  assert(!('verification' in plugin), `${label}: deprecated verification metadata is present`)
  assert(!('curation' in plugin), `${label}: deprecated curation metadata is present`)
}

const calculatedKindCounts = Object.fromEntries(
  [...registry.plugins.reduce((map, plugin) => {
    map.set(plugin.kind, (map.get(plugin.kind) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b)),
)
const calculatedEvidenceCounts = Object.fromEntries(
  [...registry.plugins.reduce((map, plugin) => {
    map.set(plugin.evidence.status, (map.get(plugin.evidence.status) ?? 0) + 1)
    return map
  }, new Map<string, number>()).entries()].sort(([a], [b]) => a.localeCompare(b)),
)
assert(JSON.stringify(calculatedKindCounts) === JSON.stringify(registry.stats.byKind), 'stats.byKind is stale')
assert(JSON.stringify(calculatedEvidenceCounts) === JSON.stringify(registry.stats.byEvidence), 'stats.byEvidence is stale')

const collections: PluginCollection[] = []
for (const filename of ['better-web-ui.json', 'coding-essentials.json', 'research.json']) {
  const path = join(root, 'collections', filename)
  await access(path)
  const collection = JSON.parse(await readFile(path, 'utf8')) as PluginCollection
  collections.push(collection)
  assert(collection.schemaVersion === 1, `${filename}: schemaVersion must be 1`)
  assert(Array.isArray(collection.plugins) && collection.plugins.length > 0, `${filename}: plugins must not be empty`)
  assert(new Set(collection.plugins).size === collection.plugins.length, `${filename}: duplicate plugin ids`)
  for (const id of collection.plugins) assert(ids.has(id), `${filename}: ${id} is missing from the registry`)
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
  assert(generatedStart !== -1 && generatedEnd > generatedStart, `${filename} plugin index markers are missing or invalid`)
  if (generatedStart !== -1 && generatedEnd > generatedStart) {
    const actual = readme.slice(generatedStart + startMarker.length, generatedEnd).trim()
    assert(actual === expected.trim(), `${filename} plugin index is stale; run npm run update`)
  }
}

if (failures.length > 0) {
  process.stderr.write(`Registry validation failed:\n- ${failures.join('\n- ')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write(`Registry validation passed for ${registry.plugins.length} topic-listed projects.\n`)
}
