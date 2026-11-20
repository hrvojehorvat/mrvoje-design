import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { outputs, readTokens } from './scripts/build.mjs'

test('dist/ is up to date with tokens/tokens.json (run `npm run build`)', () => {
  for (const [file, text] of Object.entries(outputs())) {
    assert.equal(readFileSync(new URL(file, import.meta.url), 'utf8'), text, file)
  }
})

test('every theme points at a palette with steps 50…700', () => {
  const t = readTokens()
  for (const [name, { palette }] of Object.entries(t.themes)) {
    for (const step of ['50', '100', '200', '300', '400', '500', '600', '700']) {
      assert.match(t.palettes[palette]?.[step] ?? '', /^#[0-9a-f]{6}$/, `theme-${name} → ${palette}-${step}`)
    }
  }
})

test('JS constants load and match the JSON', async () => {
  const js = await import('./dist/tokens.js')
  const t = readTokens()
  assert.deepEqual(js.plum, t.palettes.plum)
  assert.deepEqual(js.radius, t.native.radius)
})
