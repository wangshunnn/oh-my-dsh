import {
  DISCOVERY_QUERY,
  decodePackageJsonText,
  githubGraphqlRequest,
} from './registry.ts'
import type { GitHubRepository, PackageJson } from './registry.ts'

export const DISCOVERY_START_TIMESTAMP = '2008-01-01T00:00:00Z'
export const DISCOVERY_SLICE_SIZE = 50
export const DISCOVERY_COUNT_BATCH_SIZE = 20
export const MAX_ROOT_PACKAGE_BYTES = 512 * 1024
export const MAX_DISCOVERY_GRAPHQL_REQUESTS = 700

export interface CreationRange {
  startMs: number
  endMs: number
}

export interface DiscoverySlice extends CreationRange {
  count: number
}

export interface DiscoveredRepository {
  repository: GitHubRepository
  rootPackageJson: PackageJson | null
}

export interface DiscoveryResult {
  repositories: DiscoveredRepository[]
  reportedTotal: number
  discoveredTotal: number
  sliceCount: number
  graphqlRequests: number
}

interface GraphqlRepositoryNode {
  id: string
  name: string
  nameWithOwner: string
  url: string
  description: string | null
  isArchived: boolean
  isFork: boolean
  diskUsage: number | null
  stargazerCount: number
  forkCount: number
  openIssues: { totalCount: number }
  defaultBranchRef: {
    name: string
    target: { oid: string }
  } | null
  createdAt: string
  pushedAt: string | null
  updatedAt: string
  primaryLanguage: { name: string } | null
  licenseInfo: { spdxId: string | null } | null
  repositoryTopics: {
    nodes: Array<{ topic: { name: string } } | null>
  }
  packageFile: {
    byteSize: number
    isBinary: boolean
    text: string | null
  } | null
}

interface BatchedCountQueryData {
  [key: string]: { repositoryCount: number } | { remaining: number } | undefined
  rateLimit?: { remaining: number }
}

interface SliceQueryData {
  search: {
    repositoryCount: number
    nodes: Array<GraphqlRepositoryNode | null>
  }
  rateLimit?: { remaining: number }
}

type GraphqlRequester = <T>(
  query: string,
  variables: Record<string, unknown>,
  token: string,
) => Promise<T>

const SLICE_QUERY = `
  query DiscoverRepositories($queryString: String!, $limit: Int!) {
    search(type: REPOSITORY, query: $queryString, first: $limit) {
      repositoryCount
      nodes {
        ... on Repository {
          id
          name
          nameWithOwner
          url
          description
          isArchived
          isFork
          diskUsage
          stargazerCount
          forkCount
          openIssues: issues(states: OPEN) { totalCount }
          defaultBranchRef { name target { oid } }
          createdAt
          pushedAt
          updatedAt
          primaryLanguage { name }
          licenseInfo { spdxId }
          repositoryTopics(first: 20) {
            nodes { topic { name } }
          }
          packageFile: object(expression: "HEAD:package.json") {
            ... on Blob { byteSize isBinary text }
          }
        }
      }
    }
    rateLimit { remaining }
  }
`

function toSecond(value: number): number {
  return Math.floor(value / 1000) * 1000
}

export function formatGitHubTimestamp(value: number): string {
  return new Date(toSecond(value)).toISOString().replace('.000Z', 'Z')
}

export function creationRangeQuery(range: CreationRange): string {
  return `${DISCOVERY_QUERY} created:${formatGitHubTimestamp(range.startMs)}..${formatGitHubTimestamp(range.endMs)}`
}

export function splitCreationRange(range: CreationRange): [CreationRange, CreationRange] {
  const startMs = toSecond(range.startMs)
  const endMs = toSecond(range.endMs)
  if (startMs >= endMs) {
    throw new Error(`Cannot split one-second discovery range ${creationRangeQuery({ startMs, endMs })}`)
  }
  const midpointMs = toSecond(startMs + Math.floor((endMs - startMs) / 2))
  return [
    { startMs, endMs: midpointMs },
    { startMs: midpointMs + 1000, endMs },
  ]
}

export async function planCreationSlices(
  range: CreationRange,
  countRepositories: (range: CreationRange) => Promise<number>,
  limit = DISCOVERY_SLICE_SIZE,
): Promise<{ reportedTotal: number; slices: DiscoverySlice[] }> {
  const slices: DiscoverySlice[] = []
  const reportedTotal = await countRepositories(range)

  async function visit(current: CreationRange, knownCount?: number): Promise<void> {
    const count = knownCount ?? await countRepositories(current)
    if (count === 0) return
    if (count <= limit) {
      slices.push({ ...current, count })
      return
    }
    const [left, right] = splitCreationRange(current)
    await visit(left)
    await visit(right)
  }

  await visit(range, reportedTotal)
  return { reportedTotal, slices }
}

export async function planCreationSlicesBatched(
  range: CreationRange,
  countRepositories: (ranges: CreationRange[]) => Promise<number[]>,
  limit = DISCOVERY_SLICE_SIZE,
  batchSize = DISCOVERY_COUNT_BATCH_SIZE,
): Promise<{ reportedTotal: number; slices: DiscoverySlice[] }> {
  if (!Number.isInteger(batchSize) || batchSize < 1) {
    throw new Error('Discovery count batch size must be a positive integer')
  }
  const slices: DiscoverySlice[] = []
  const queue: CreationRange[] = [range]
  let reportedTotal: number | null = null

  while (queue.length > 0) {
    const batch = queue.splice(0, batchSize)
    const counts = await countRepositories(batch)
    if (counts.length !== batch.length) {
      throw new Error(`Discovery count batch returned ${counts.length} results for ${batch.length} ranges`)
    }
    if (reportedTotal === null) reportedTotal = counts[0]

    for (let index = 0; index < batch.length; index += 1) {
      const current = batch[index]
      const count = counts[index]
      if (!Number.isInteger(count) || count < 0) {
        throw new Error(`Invalid repository count for ${creationRangeQuery(current)}: ${count}`)
      }
      if (count === 0) continue
      if (count <= limit) {
        slices.push({ ...current, count })
        continue
      }
      queue.push(...splitCreationRange(current))
    }
  }

  return { reportedTotal: reportedTotal ?? 0, slices }
}

function countBatchQuery(size: number): string {
  const variables = Array.from({ length: size }, (_, index) => `$query${index}: String!`).join(', ')
  const searches = Array.from({ length: size }, (_, index) => `
    search${index}: search(type: REPOSITORY, query: $query${index}, first: 1) {
      repositoryCount
    }
  `).join('')
  return `query CountRepositories(${variables}) {${searches}\nrateLimit { remaining }\n}`
}

function normalizeNode(node: GraphqlRepositoryNode): DiscoveredRepository {
  const [owner] = node.nameWithOwner.split('/', 1)
  const packageFile = node.packageFile
  const rootPackageJson = packageFile
    && !packageFile.isBinary
    && packageFile.byteSize <= MAX_ROOT_PACKAGE_BYTES
    ? decodePackageJsonText(packageFile.text)
    : null

  return {
    repository: {
      node_id: node.id,
      full_name: node.nameWithOwner,
      name: node.name,
      owner: { login: owner },
      html_url: node.url,
      description: node.description,
      topics: node.repositoryTopics.nodes
        .flatMap(item => item ? [item.topic.name] : [])
        .sort(),
      archived: node.isArchived,
      fork: node.isFork,
      size: node.diskUsage ?? 0,
      language: node.primaryLanguage?.name ?? null,
      license: node.licenseInfo ? { spdx_id: node.licenseInfo.spdxId } : null,
      stargazers_count: node.stargazerCount,
      forks_count: node.forkCount,
      open_issues_count: node.openIssues.totalCount,
      default_branch: node.defaultBranchRef?.name ?? '',
      created_at: node.createdAt,
      pushed_at: node.pushedAt,
      updated_at: node.updatedAt,
      head_oid: node.defaultBranchRef?.target.oid ?? null,
    },
    rootPackageJson,
  }
}

export async function discoverRepositories(
  token: string,
  scanTimestamp: string,
  request: GraphqlRequester = githubGraphqlRequest,
  reportProgress: (message: string) => void = () => {},
): Promise<DiscoveryResult> {
  if (!token) {
    throw new Error('Complete repository discovery requires GITHUB_TOKEN or GH_TOKEN')
  }
  const endMs = toSecond(Date.parse(scanTimestamp))
  const startMs = Date.parse(DISCOVERY_START_TIMESTAMP)
  if (!Number.isFinite(endMs) || endMs < startMs) {
    throw new Error(`Invalid discovery scan timestamp: ${scanTimestamp}`)
  }
  const rootRange = { startMs, endMs }
  let graphqlRequests = 0
  const checkedRequest = async <T>(
    query: string,
    variables: Record<string, unknown>,
  ): Promise<T> => {
    if (graphqlRequests >= MAX_DISCOVERY_GRAPHQL_REQUESTS) {
      throw new Error(`Discovery exceeded its ${MAX_DISCOVERY_GRAPHQL_REQUESTS}-request GraphQL budget`)
    }
    graphqlRequests += 1
    const data = await request<T>(query, variables, token)
    const remaining = (data as { rateLimit?: { remaining?: number } }).rateLimit?.remaining
    if (remaining !== undefined && remaining < 50) {
      throw new Error(`Discovery stopped with only ${remaining} GraphQL points remaining`)
    }
    return data
  }
  const countRepositories = async (ranges: CreationRange[]): Promise<number[]> => {
    const variables = Object.fromEntries(
      ranges.map((range, index) => [`query${index}`, creationRangeQuery(range)]),
    )
    const data = await checkedRequest<BatchedCountQueryData>(countBatchQuery(ranges.length), variables)
    if (graphqlRequests === 1 || graphqlRequests % 10 === 0) {
      reportProgress(`Discovery planning: ${graphqlRequests} GraphQL requests, ${ranges.length} ranges in latest batch.`)
    }
    return ranges.map((_, index) => {
      const result = data[`search${index}`]
      if (!result || !('repositoryCount' in result)) {
        throw new Error(`Discovery count response is missing search${index}`)
      }
      return result.repositoryCount
    })
  }
  const plan = await planCreationSlicesBatched(rootRange, countRepositories)
  reportProgress(
    `Discovery planned ${plan.slices.length} complete time slices in ${graphqlRequests} GraphQL requests.`,
  )
  const queue: CreationRange[] = [...plan.slices]
  const repositories: DiscoveredRepository[] = []
  let fetchedSlices = 0

  while (queue.length > 0) {
    const slice = queue.shift()!
    const data = await checkedRequest<SliceQueryData>(SLICE_QUERY, {
      queryString: creationRangeQuery(slice),
      limit: DISCOVERY_SLICE_SIZE,
    })
    const currentCount = data.search.repositoryCount
    if (currentCount > DISCOVERY_SLICE_SIZE) {
      const [left, right] = splitCreationRange(slice)
      queue.unshift(left, right)
      continue
    }
    const nodes = data.search.nodes.flatMap(node => node ? [node] : [])
    if (nodes.length !== currentCount) {
      throw new Error(
        `Incomplete discovery slice ${creationRangeQuery(slice)}: expected ${currentCount}, received ${nodes.length}`,
      )
    }
    repositories.push(...nodes.map(normalizeNode))
    fetchedSlices += 1
    if (fetchedSlices % 20 === 0 || queue.length === 0) {
      reportProgress(
        `Discovery fetched ${fetchedSlices} slices and ${repositories.length} repositories; ${queue.length} slices remain.`,
      )
    }
  }

  const unique = new Map<string, DiscoveredRepository>()
  for (const discovered of repositories) {
    const id = discovered.repository.node_id
    if (unique.has(id)) {
      throw new Error(`Duplicate repository node across discovery slices: ${discovered.repository.full_name}`)
    }
    unique.set(id, discovered)
  }
  return {
    repositories: [...unique.values()],
    reportedTotal: plan.reportedTotal,
    discoveredTotal: unique.size,
    sliceCount: fetchedSlices,
    graphqlRequests,
  }
}
