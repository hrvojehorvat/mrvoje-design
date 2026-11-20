# @mrvoje/design

Shared design tokens for the mrvoje apps (portfolio, BarMint, Plumcast): one source,
three outputs, so Angular, React and React Native apps use the same colours.

| File | For |
|---|---|
| `tokens/tokens.json` | **The source.** Edit only this. |
| `dist/theme.css` | Tailwind v4 apps: palettes, `accent-*`, dark mode, `.theme-mint` / `.theme-purple`, page base |
| `dist/tokens.css` | Web apps without Tailwind: the same as plain CSS variables |
| `dist/tokens.js` (+ `.d.ts`) | JS / React Native: `plum`, `mint`, `accent`, `nativeColors`, `radius`, `nativeFont` |

## Use

```json
"dependencies": { "@mrvoje/design": "github:hrvojehorvat/mrvoje-design#v1.0.0" }
```

Tailwind (Angular or React web):

```css
@import 'tailwindcss';
@import '@mrvoje/design/theme.css';
@source './app';
```

Put `theme-mint` / `theme-purple` on a project's root element; without one the accent is neutral
(black in light mode, white in dark mode). Shared UI only uses `accent-*`.

React Native:

```ts
import { plum, nativeColors, radius, nativeFont } from '@mrvoje/design'
```

## Change a token

```sh
npm run build   # tokens.json → dist/
npm test        # fails if dist/ is out of date
```

Commit `dist/` (apps install from git, without a build step), tag `vX.Y.Z`, push the tag,
then bump the tag in each app when you want the change there.
