import { access, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildEnglishReadmePluginIndex,
  buildReadmePluginIndex,
} from './lib/registry.ts'
import type {
  PluginCollection,
  PluginRegistry,
  PluginKind,
  VerificationStatus,
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

for (const [index, plugin] of registry.plugins.entries()) {
  const label = `plugins[${index}] (${plugin.id ?? 'missing id'})`
  assert(typeof plugin.id === 'string' && /^[^/]+\/[^/]+$/.test(plugin.id), `${label}: invalid id`)
  assert(!ids.has(plugin.id), `${label}: duplicate id`)
  ids.add(plugin.id)
  assert(plugin.url === `https://github.com/${plugin.id}`, `${label}: URL is not canonical`)
  assert(allowedKinds.has(plugin.kind), `${label}: invalid kind ${plugin.kind}`)
  assert(Array.isArray(plugin.categories) && plugin.categories.length > 0, `${label}: missing categories`)
  assert(allowedStatuses.has(plugin.verification?.status), `${label}: invalid verification status`)
  assert(plugin.topics?.includes('dsh-plugin'), `${label}: discovery topic missing`)
  assert(Number.isInteger(plugin.metrics?.stars) && plugin.metrics.stars >= 0, `${label}: invalid star count`)

  const manifestDetected = plugin.verification?.status === 'manifest-detected'
  assert(manifestDetected, `${label}: public registry only accepts current Bundle manifests`)
  assert(plugin.install?.available === manifestDetected, `${label}: install availability exceeds evidence`)
  if (plugin.install?.available) {
    assert(plugin.package?.manifest === 'dsh.bundle', `${label}: installable entry lacks dsh.bundle evidence`)
    assert(plugin.install.source === `github:${plugin.id}`, `${label}: invalid install source`)
  }
}

const overrides = JSON.parse(
  await readFile(join(root, 'registry/overrides.json'), 'utf8'),
) as RegistryOverrides
for (const [id, override] of Object.entries(overrides.repositories ?? {})) {
  if (override.exclude === true) {
    assert(!ids.has(id), `${id}: excluded repository is present in the generated registry`)
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
