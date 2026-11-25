/**
 * Turns tokens/tokens.json into the files apps import (dist/). Run with `npm run build`.
 * The output is committed, so installing the package from git needs no build step.
 *   dist/theme.css   Tailwind v4 (@theme, dark-mode accent, .theme-*, page base styles)
 *   dist/tokens.css  the same variables as plain CSS, for web apps without Tailwind
 *   dist/tokens.js   constants for JS / React Native (+ tokens.d.ts)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const STEPS = ['50', '100', '200', '300', '400', '500', '600', '700']
const HEADER = '/* Generated from tokens/tokens.json by scripts/build.mjs. Do not edit. */\n'

export function readTokens() {
  return JSON.parse(readFileSync(resolve(root, 'tokens/tokens.json'), 'utf8'))
}

const indent = (lines, n) => lines.map((l) => ' '.repeat(n) + l).join('\n')

function paletteVars(t) {
  const lines = []
  for (const [name, palette] of Object.entries(t.palettes)) {
    for (const [step, hex] of Object.entries(palette)) lines.push(`--color-${name}-${step}: ${hex};`)
    lines.push('')
  }
  return lines
}

const accentVars = (accent) => [
  ...STEPS.map((s) => `--color-accent-${s}: ${accent[s]};`),
  `--color-accent-contrast: ${accent.contrast};`,
]

const fontVars = (t) => [`--font-sans: ${t.font.sans.join(', ')};`, `--font-mono: ${t.font.mono.join(', ')};`]

function themeClasses(t) {
  return Object.entries(t.themes)
    .map(([name, { palette, contrast }]) =>
      [
        `.theme-${name} {`,
        indent(
          [
            ...STEPS.map((s) => `--color-accent-${s}: var(--color-${palette}-${s});`),
            `--color-accent-contrast: ${contrast};`,
            `accent-color: var(--color-${palette}-500);`,
          ],
          2,
        ),
        '}',
      ].join('\n'),
    )
    .join('\n\n')
}

const darkAccent = (t) => `@media (prefers-color-scheme: dark) {
  :root {
${indent(accentVars(t.accent.dark), 4)}
  }
}`

const FADE_IN = `@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
}`

export function themeCss(t) {
  return `${HEADER}/*
 * Use after Tailwind:  @import 'tailwindcss';  @import '@mrvoje/design/theme.css';
 * Accent: the one colour that differs between the portfolio and each project.
 * Shared UI only uses accent-*; a project sets its own with a theme class on its root element.
 */
@theme {
${indent([...paletteVars(t), ...accentVars(t.accent.light), '', ...fontVars(t)], 2)}
}

:root {
  color-scheme: light dark;
  accent-color: var(--color-accent-500);
}

${darkAccent(t)}

/* Project themes: same design, own colour. */
${themeClasses(t)}

${FADE_IN}

body {
  @apply bg-[${t.page.light}] dark:bg-[${t.page.dark}] font-sans antialiased;
  -webkit-font-smoothing: antialiased;
}
`
}

export function tokensCss(t) {
  return `${HEADER}/* Plain CSS variables (no Tailwind). Put .theme-<name> on a project's root element. */
:root {
${indent([...paletteVars(t), ...accentVars(t.accent.light), '', ...fontVars(t)], 2)}
  color-scheme: light dark;
  accent-color: var(--color-accent-500);
}

${darkAccent(t)}

${themeClasses(t)}

${FADE_IN}

body {
  background: ${t.page.light};
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}

@media (prefers-color-scheme: dark) {
  body {
    background: ${t.page.dark};
  }
}
`
}

function jsExports(t) {
  const { mint, plum } = t.palettes
  return {
    mint,
    plum,
    accent: t.accent,
    font: t.font,
    page: t.page,
    palettes: t.palettes,
    nativeColors: t.native.colors,
    nativeColorsLight: t.native.colorsLight,
    radius: t.native.radius,
    nativeFont: t.native.font,
  }
}

export function tokensJs(t) {
  const body = Object.entries(jsExports(t))
    .map(([name, value]) => `export const ${name} = ${JSON.stringify(value, null, 2)};`)
    .join('\n\n')
  return `${HEADER}${body}\n`
}

function dtsType(value, depth) {
  if (Array.isArray(value)) return `readonly [${value.map((v) => JSON.stringify(v)).join(', ')}]`
  if (typeof value !== 'object') return JSON.stringify(value)
  const pad = '  '.repeat(depth + 1)
  const keys = Object.entries(value).map(([k, v]) => `${pad}readonly ${/^\w+$/.test(k) && !/^\d/.test(k) ? k : JSON.stringify(k)}: ${dtsType(v, depth + 1)};`)
  return `{\n${keys.join('\n')}\n${'  '.repeat(depth)}}`
}

export function tokensDts(t) {
  const body = Object.entries(jsExports(t))
    .map(([name, value]) => `export declare const ${name}: ${dtsType(value, 0)};`)
    .join('\n\n')
  return `${HEADER}${body}\n`
}

export function outputs(t = readTokens()) {
  return {
    'dist/theme.css': themeCss(t),
    'dist/tokens.css': tokensCss(t),
    'dist/tokens.js': tokensJs(t),
    'dist/tokens.d.ts': tokensDts(t),
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  mkdirSync(resolve(root, 'dist'), { recursive: true })
  for (const [file, text] of Object.entries(outputs())) {
    writeFileSync(resolve(root, file), text)
    console.log(`wrote ${file}`)
  }
}
