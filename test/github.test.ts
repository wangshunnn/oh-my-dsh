import assert from 'node:assert/strict'
import test from 'node:test'
import type { TestContext } from 'node:test'
import { githubGraphqlRequest } from '../scripts/lib/registry.ts'

function mockResponses(context: TestContext, responses: unknown[]) {
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const delays: number[] = []
  const warnings: string[] = []
  context.mock.method(Math, 'random', () => 0.5)
  context.mock.method(globalThis, 'setTimeout', (callback: () => void, delay: number) => {
    delays.push(delay)
    queueMicrotask(callback)
    return {} as NodeJS.Timeout
  })
  context.mock.method(process.stderr, 'write', (message: string) => {
    warnings.push(message)
    return true
  })
  context.mock.method(globalThis, 'fetch', async (url: string, init?: RequestInit) => {
    const response = responses[calls.length]
    calls.push({ url, init })
    assert.notEqual(response, undefined, 'Unexpected extra GitHub request')
    return response instanceof Response ? response : Response.json(response)
  })
  return { calls, delays, warnings }
}

test('retries GitHub query execution errors and discards partial data', async context => {
  const { calls, delays, warnings } = mockResponses(context, [
    {
      data: { search: null },
      errors: [{ message: 'Something went wrong while executing your query on 2026-10-15T07:28:12Z.' }],
    },
    { data: { search: { repositoryCount: 48 } } },
  ])
  const variables = { queryString: 'topic:dsh-plugin archived:true' }
  const data = await githubGraphqlRequest('query CountRepositories { search { repositoryCount } }', variables, 'test-token')

  assert.deepEqual(data, { search: { repositoryCount: 48 } })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, 'https://api.github.com/graphql')
  assert.deepEqual(calls[1].init, calls[0].init)
  assert.deepEqual(JSON.parse(calls[0].init!.body as string).variables, variables)
  assert.deepEqual(delays, [1000])
  assert.match(warnings[0], /retrying 2\/5/)
})

test('stops after five GraphQL internal errors with exponential backoff', async context => {
  const { calls, delays } = mockResponses(context, Array.from({ length: 5 }, () => ({
    errors: [{ type: 'INTERNAL', message: 'Internal execution error' }],
  })))

  await assert.rejects(githubGraphqlRequest('query { viewer { login } }', {}, 'test-token'), /Internal execution error/)
  assert.equal(calls.length, 5)
  assert.deepEqual(delays, [1000, 2000, 4000, 8000])
})

test('does not retry permanent errors, mixed errors, or missing GraphQL data', async context => {
  const cases = [
    { errors: [{ message: 'Field does not exist on type Query' }] },
    { errors: [{ type: 'FORBIDDEN', message: 'Resource not accessible by integration' }] },
    { errors: [{ type: 'RATE_LIMITED', message: 'API rate limit exceeded' }] },
    { errors: [{ type: 'INTERNAL' }, { type: 'FORBIDDEN', message: 'Access denied' }] },
    {},
  ]
  for (const payload of cases) {
    await context.test(JSON.stringify(payload), async subcontext => {
      const { calls, delays } = mockResponses(subcontext, [payload])
      await assert.rejects(githubGraphqlRequest('query { viewer { login } }', {}, 'test-token'), /GitHub GraphQL request failed/)
      assert.equal(calls.length, 1)
      assert.deepEqual(delays, [])
    })
  }
})

test('preserves HTTP retries when a GraphQL request also needs retrying', async context => {
  const { calls, delays } = mockResponses(context, [
    new Response('Service unavailable', { status: 503, headers: { 'retry-after': '2' } }),
    { errors: [{ message: 'Service unavailable' }, { message: 'Request timed out' }] },
    { data: { viewer: { login: 'example' } } },
  ])

  assert.deepEqual(await githubGraphqlRequest('query { viewer { login } }', {}, 'test-token'), {
    viewer: { login: 'example' },
  })
  assert.equal(calls.length, 3)
  assert.deepEqual(delays, [2000, 1000])
})
