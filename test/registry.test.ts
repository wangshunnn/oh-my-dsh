import assert from 'node:assert/strict'
import test from 'node:test'
import {
  classifyCategories,
  classifyKind,
  compactDescription,
  decodePackageJson,
  detectManifest,
  replaceGeneratedSection,
  verificationStatus,
} from '../scripts/lib/registry.ts'

const repository = {
  name: 'dsh-at-file',
  description: 'Codex-style @file mentions for the DeepSeek Harness web GUI',
  topics: ['dsh', 'dsh-plugin'],
  archived: false,
  size: 42,
}

test('detects current DSH bundle manifests', () => {
  const packageJson = { dsh: { bundle: { patch: './cordis.patch.yml' } } }
  assert.equal(detectManifest(packageJson), 'dsh.bundle')
  assert.equal(verificationStatus(repository, packageJson), 'manifest-detected')
})

test('keeps legacy dshx integrations distinct', () => {
  const packageJson = { dshx: { contributes: { tools: ['view_image'] } } }
  assert.equal(detectManifest(packageJson), 'dshx')
  assert.equal(verificationStatus(repository, packageJson), 'legacy-manifest-detected')
})

test('placeholder and archived states take precedence', () => {
  assert.equal(verificationStatus({ ...repository, size: 0 }, null), 'placeholder')
  assert.equal(verificationStatus({ ...repository, archived: true }, null), 'archived')
})

test('classifies common ecosystem shapes', () => {
  assert.equal(classifyKind(repository, { dsh: { bundle: { patch: './patch.yml' } } }), 'plugin')
  assert.equal(classifyKind({ ...repository, name: 'awesome-dsh-plugins', description: 'plugin directory' }, null), 'collection')
  assert.equal(classifyKind({ ...repository, name: 'dsh-ocean-skin', description: 'a theme' }, null), 'skin')
  assert.equal(classifyKind({ ...repository, description: 'Open workspace directories in VS Code' }, { dsh: { bundle: { patch: './patch.yml' } } }), 'plugin')
  assert.deepEqual(classifyCategories(repository, null), ['coding', 'web-ui'])
})

test('decodes GitHub content API package responses safely', () => {
  const content = Buffer.from(JSON.stringify({ name: 'example' })).toString('base64')
  assert.deepEqual(decodePackageJson({ type: 'file', content }), { name: 'example' })
  assert.equal(decodePackageJson({ type: 'file', content: 'not json' }), null)
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
