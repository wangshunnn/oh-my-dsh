import assert from 'node:assert/strict'
import test from 'node:test'
import {
  creationRangeQuery,
  discoverRepositories,
  formatGitHubTimestamp,
  planCreationSlices,
  planCreationSlicesBatched,
  splitCreationRange,
} from '../scripts/lib/discovery.ts'
import type { CreationRange } from '../scripts/lib/discovery.ts'

test('splits inclusive creation ranges without a one-second overlap or gap', () => {
  const range = {
    startMs: Date.parse('2026-08-17T00:00:00Z'),
    endMs: Date.parse('2026-08-17T00:00:04Z'),
  }
  const [left, right] = splitCreationRange(range)
  assert.equal(formatGitHubTimestamp(left.endMs), '2026-08-17T00:00:02Z')
  assert.equal(formatGitHubTimestamp(right.startMs), '2026-08-17T00:00:03Z')
  assert.equal(right.startMs - left.endMs, 1000)
  assert.equal(
    creationRangeQuery(left),
    'topic:dsh-plugin created:2026-08-17T00:00:00Z..2026-08-17T00:00:02Z',
  )
})

test('recursively plans complete slices below the configured result limit', async () => {
  const root = { startMs: 0, endMs: 4000 }
  const counts = new Map([
    ['0:4000', 101],
    ['0:2000', 50],
    ['3000:4000', 51],
    ['3000:3000', 25],
    ['4000:4000', 26],
  ])
  const plan = await planCreationSlices(root, async range => {
    const count = counts.get(`${range.startMs}:${range.endMs}`)
    assert.notEqual(count, undefined)
    return count!
  }, 50)

  assert.equal(plan.reportedTotal, 101)
  assert.deepEqual(plan.slices, [
    { startMs: 0, endMs: 2000, count: 50 },
    { startMs: 3000, endMs: 3000, count: 25 },
    { startMs: 4000, endMs: 4000, count: 26 },
  ])
})

test('batches count queries while preserving the reported total', async () => {
  const calls: CreationRange[][] = []
  const plan = await planCreationSlicesBatched(
    { startMs: 0, endMs: 15_000 },
    async ranges => {
      calls.push(ranges)
      return ranges.map(range => Math.floor((range.endMs - range.startMs) / 1000) + 1)
    },
    2,
    4,
  )

  assert.equal(plan.reportedTotal, 16)
  assert.equal(plan.slices.reduce((total, slice) => total + slice.count, 0), 16)
  assert.ok(plan.slices.every(slice => slice.count <= 2))
  assert.ok(calls.some(batch => batch.length === 4))
  assert.ok(calls.length < 15)
})

test('fails explicitly when more than the slice limit shares one creation second', async () => {
  await assert.rejects(
    planCreationSlices({ startMs: 0, endMs: 0 }, async () => 51, 50),
    /Cannot split one-second discovery range/,
  )
})

test('discovers low-star root bundles without using star-ranked pagination', async () => {
  const packageText = JSON.stringify({
    name: 'low-star-plugin',
    dsh: { bundle: { patch: './cordis.patch.yml' } },
  })
  const nodes = [
    {
      id: 'R_low',
      name: 'low-star-plugin',
      nameWithOwner: 'example/low-star-plugin',
      url: 'https://github.com/example/low-star-plugin',
      description: 'A low-star DSH plugin',
      isArchived: false,
      isFork: false,
      diskUsage: 42,
      stargazerCount: 0,
      forkCount: 0,
      openIssues: { totalCount: 0 },
      defaultBranchRef: { name: 'main', target: { oid: 'abc123' } },
      createdAt: '2008-01-01T00:00:00Z',
      pushedAt: '2026-08-17T00:00:00Z',
      updatedAt: '2026-08-17T00:00:00Z',
      primaryLanguage: { name: 'TypeScript' },
      licenseInfo: { spdxId: 'MIT' },
      repositoryTopics: { nodes: [{ topic: { name: 'dsh-plugin' } }] },
      packageFile: { byteSize: packageText.length, isBinary: false, text: packageText },
    },
    {
      id: 'R_empty',
      name: 'topic-only',
      nameWithOwner: 'example/topic-only',
      url: 'https://github.com/example/topic-only',
      description: null,
      isArchived: false,
      isFork: false,
      diskUsage: 1,
      stargazerCount: 100,
      forkCount: 0,
      openIssues: { totalCount: 0 },
      defaultBranchRef: { name: 'main', target: { oid: 'def456' } },
      createdAt: '2008-01-01T00:00:01Z',
      pushedAt: null,
      updatedAt: '2026-08-17T00:00:00Z',
      primaryLanguage: null,
      licenseInfo: null,
      repositoryTopics: { nodes: [{ topic: { name: 'dsh-plugin' } }] },
      packageFile: null,
    },
  ]
  const request = async <T>(query: string): Promise<T> => {
    return (query.includes('CountRepositories')
      ? { search0: { repositoryCount: nodes.length } }
      : { search: { repositoryCount: nodes.length, nodes } }) as T
  }

  const result = await discoverRepositories(
    'test-token',
    '2008-01-01T00:00:01Z',
    request,
  )
  assert.equal(result.reportedTotal, 2)
  assert.equal(result.discoveredTotal, 2)
  assert.equal(result.sliceCount, 1)
  const lowStar = result.repositories.find(item => item.repository.full_name === 'example/low-star-plugin')
  assert.equal(lowStar?.repository.stargazers_count, 0)
  assert.equal(lowStar?.rootPackageJson?.dsh?.bundle?.patch, './cordis.patch.yml')
})
