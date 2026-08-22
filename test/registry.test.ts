import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyCategories,
  classifyKind,
  collectionRepositoryIssue,
  compactDescription,
  detectManifest,
  listingEvidence,
  mergeRegistryPlugins,
  replaceGeneratedSection,
} from '../scripts/lib/registry.ts'
import type { RegistryPlugin } from '../scripts/lib/registry.ts'

const repository = {
  name: 'dsh-at-file',
  description: 'Codex-style @file mentions for the DeepSeek Harness web GUI',
  topics: ['dsh', 'dsh-plugin'],
  archived: false,
  size: 42,
}

test('records root package evidence without claiming installability', () => {
  const bundle = { dsh: { bundle: { patch: './cordis.patch.yml' } } }
  assert.equal(detectManifest(bundle), 'dsh.bundle')
  assert.equal(listingEvidence(bundle), 'bundle-manifest')
  assert.equal(listingEvidence({ dshx: { contributes: {} } }), 'legacy-manifest')
  assert.equal(listingEvidence({ dsh: { client: {} } }), 'dsh-structure')
  assert.equal(listingEvidence(null), 'topic-only')
})

test('classifies common ecosystem shapes', () => {
  assert.equal(classifyKind(repository, { dsh: { bundle: { patch: './patch.yml' } } }), 'plugin')
  assert.equal(classifyKind({ ...repository, name: 'awesome-dsh-plugins', description: 'plugin directory' }, null), 'collection')
  assert.equal(classifyKind({ ...repository, name: 'dsh-ocean-skin', description: 'a theme' }, null), 'skin')
  assert.deepEqual(classifyCategories(repository, null), ['coding', 'web-ui'])
})

test('fails curated repositories early when identity or eligibility changes', () => {
  const current = {
    full_name: 'FSMargoo/dsh-at-file',
    topics: ['dsh-plugin'],
    archived: false,
    fork: false,
    size: 42,
  }
  assert.match(
    collectionRepositoryIssue('omdsh-dev/dsh-at-file', current) ?? '',
    /moved or was renamed to FSMargoo\/dsh-at-file/,
  )
  assert.equal(collectionRepositoryIssue('FSMargoo/dsh-at-file', current), null)
  assert.match(collectionRepositoryIssue('missing/repo', null) ?? '', /was not found/)
  assert.match(collectionRepositoryIssue('FSMargoo/dsh-at-file', { ...current, topics: [] }) ?? '', /topic is missing/)
})

function plugin(nodeId: string, id: string): RegistryPlugin {
  const [owner, name] = id.split('/')
  return {
    id,
    githubNodeId: nodeId,
    name,
    owner,
    repository: name,
    url: `https://github.com/${id}`,
    description: null,
    kind: 'plugin',
    categories: ['other'],
    topics: ['dsh-plugin'],
    language: null,
    license: { spdx: null, status: 'unknown' },
    metrics: { stars: 0, forks: 0, openIssues: 0 },
    repositoryState: {
      defaultBranch: 'main',
      headOid: 'abc',
      createdAt: '2026-08-01T00:00:00Z',
      pushedAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z',
    },
    package: { name: null, version: null, private: null, manifest: null },
    evidence: { status: 'topic-only', checkedAt: '2026-08-01T00:00:00Z' },
  }
}

test('incremental merges replace renamed repositories by stable GitHub node id', () => {
  const previous = plugin('R_1', 'old-owner/plugin')
  const renamed = plugin('R_1', 'new-owner/plugin')
  const merged = mergeRegistryPlugins([previous], [renamed], new Set(), 'incremental')
  assert.deepEqual(merged.map(item => item.id), ['new-owner/plugin'])
})

test('incremental merges remove explicit tombstones and full scans ignore old state', () => {
  const first = plugin('R_1', 'owner/first')
  const second = plugin('R_2', 'owner/second')
  assert.deepEqual(
    mergeRegistryPlugins([first, second], [], new Set(['R_1']), 'incremental').map(item => item.id),
    ['owner/second'],
  )
  assert.deepEqual(
    mergeRegistryPlugins([first], [second], new Set(), 'full').map(item => item.id),
    ['owner/second'],
  )
})

test('replaces generated README sections without touching surrounding content', () => {
  const source = 'before\n<!-- GENERATED:EXAMPLE:START -->\nold\n<!-- GENERATED:EXAMPLE:END -->\nafter\n'
  assert.equal(
    replaceGeneratedSection(source, 'EXAMPLE', 'new'),
    'before\n<!-- GENERATED:EXAMPLE:START -->\nnew\n<!-- GENERATED:EXAMPLE:END -->\nafter\n',
  )
})

test('compacts long descriptions for the README homepage', () => {
  assert.equal(compactDescription('简短介绍｜English description'), '简短介绍')
  assert.equal(compactDescription('a'.repeat(100), 10), 'aaaaaaaaa…')
})
