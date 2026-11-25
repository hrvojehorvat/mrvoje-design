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

test('every palette is in the JS `palettes` export; named mint/plum exports stay', async () => {
  const js = await import('./dist/tokens.js')
  const t = readTokens()
  assert.deepEqual(js.palettes, t.palettes)
  assert.deepEqual(js.mint, t.palettes.mint)
  assert.deepEqual(js.plum, t.palettes.plum)
})

test('nativeColorsLight has exactly the keys of nativeColors', async () => {
  const js = await import('./dist/tokens.js')
  assert.deepEqual(Object.keys(js.nativeColorsLight).sort(), Object.keys(js.nativeColors).sort())
  assert.deepEqual(js.nativeColorsLight, readTokens().native.colorsLight)
})

const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contrast = (a, b) => {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

// Existing themes (mint: white on 600 is 4.19) must not change, so only apricot is asserted.
test('apricot: contrast colour passes 4.5:1 on the filled-button steps 500 and 600', () => {
  const t = readTokens()
  const { palette, contrast: text } = t.themes.apricot
  for (const step of ['500', '600']) {
    const ratio = contrast(text, t.palettes[palette][step])
    assert.ok(ratio >= 4.5, `apricot-${step} vs ${text}: ${ratio.toFixed(2)}`)
  }
})

test('nativeColorsLight text colours pass 4.5:1 on bg and bgRaised', () => {
  const c = readTokens().native.colorsLight
  for (const key of ['text', 'textSoft', 'textMuted']) {
    for (const surface of ['bg', 'bgRaised']) {
      const ratio = contrast(c[key], c[surface])
      assert.ok(ratio >= 4.5, `${key} on ${surface}: ${ratio.toFixed(2)}`)
    }
  }
})
