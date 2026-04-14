# Orca Desktop — Blank Screen Debug Report

## TL;DR

**Problem:** Electron window showed blank gray screen, no React rendering, no errors visible initially.

**Root Cause:** `@newsflow/db` and `@newsflow/config` workspace packages were compiled as **CommonJS** (`module: "commonjs"` in tsconfig), but the Vite-based browser renderer requires **ESM** modules. Vite couldn't extract named exports from the CJS `__exportStar` wrapper pattern, causing a silent `SyntaxError: The requested module does not provide an export named 'listArticlesForTopic'`.

**Fix:** Changed both packages' `tsconfig.json` from `"module": "commonjs"` to `"module": "ESNext"` + `"moduleResolution": "bundler"`, then rebuilt.

**Why it was hard:** The error only appeared in the Electron renderer's DevTools (not in terminal), and the CJS-to-ESM mismatch produces cryptic "no export named X" errors rather than clear "module format mismatch" messages.

---

## Detailed Report

### Symptoms
- Electron window opens but shows only a blank gray screen
- No React components render
- No visible errors in the main process terminal
- Vite dev server runs fine on `localhost:5173`
- DevTools console shows: `Uncaught SyntaxError: The requested module '/@fs/Users/sandrogantze/Projects/Orca/packages/db/dist/index.js' does not provide an export named 'listArticlesForTopic'`

### Investigation Steps

1. **Checked workspace package linking** — `@newsflow/*` packages were correctly symlinked in root `node_modules`
2. **Verified package builds** — `dist/` directories existed with compiled JS
3. **Tested module resolution** — `require.resolve('@newsflow/db')` resolved correctly
4. **Cleared Vite caches** — `.vite/` directories removed, no change
5. **Examined compiled output** — Found `dist/index.js` used `"use strict"` and `__exportStar()` (CommonJS pattern)
6. **Identified the mismatch** — Browser can't use `require()`, Vite expects ESM imports

### Technical Explanation

The `@newsflow/db` package's `tsconfig.json` had:
```json
{
  "compilerOptions": {
    "module": "commonjs"
  }
}
```

This produces output like:
```js
"use strict";
var __exportStar = ...;
__exportStar(require("./queries"), exports);
```

When Vite serves this to the browser, it tries to do:
```js
import { listArticlesForTopic } from "/@fs/.../packages/db/dist/index.js"
```

But the file uses `exports` and `require()` — not `export` statements. Vite's CJS interop can handle simple `module.exports = {...}` patterns, but the TypeScript `__exportStar` helper is too complex for automatic conversion, resulting in "no export named X" errors.

### Fix Applied

**`packages/db/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

**`packages/config/tsconfig.json`:**
```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

Then rebuild both packages:
```bash
cd packages/config && npx tsc
cd packages/db && npx tsc
```

### Why This Was Difficult to Diagnose

1. **Silent failure** — The error only appears in the browser DevTools console, not in the terminal where `bun run dev` runs
2. **Misleading error message** — "does not provide an export named X" sounds like a missing function, not a module format issue
3. **Multiple layers** — Monorepo with workspace packages, Electron with separate main/renderer processes, Vite dev server — many places to look
4. **CJS appeared valid** — The compiled JS ran fine in Node.js (`require('@newsflow/db')` worked), so the packages seemed healthy
5. **No build errors** — TypeScript compiled without errors, just with the wrong module target

### How to Prevent This in the Future

1. **Use ESM for all browser-targeted packages** — Any package consumed by a Vite/Rollup-based frontend should use `"module": "ESNext"` or `"module": "ES2020"`

2. **Add a lint check** for module format:
   ```json
   // In workspace package tsconfig
   "module": "ESNext",
   "moduleResolution": "bundler"
   ```

3. **Use dual exports** in `package.json` for packages used in both Node and browser:
   ```json
   {
     "main": "dist/cjs/index.js",
     "module": "dist/esm/index.js",
     "exports": {
       ".": {
         "import": "./dist/esm/index.js",
         "require": "./dist/cjs/index.js"
       }
     }
   }
   ```

4. **Add a startup check** — The debug logging added to `main.tsx` and `App.tsx` will surface errors immediately:
   ```tsx
   // In main.tsx
   try {
     createRoot(rootEl).render(<App />);
   } catch (e) {
     document.body.innerHTML = `<pre style="color:red">${e.stack}</pre>`;
   }
   ```

5. **Check DevTools first** — When Electron shows a blank screen, the DevTools console (opened automatically in dev mode) is always the first place to look

### Files Changed

- `packages/db/tsconfig.json` — Changed module format from CommonJS to ESM
- `packages/config/tsconfig.json` — Changed module format from CommonJS to ESM
- `apps/desktop/src/renderer/main.tsx` — Added error boundary and debug logging
- `apps/desktop/src/renderer/App.tsx` — Added detailed init step logging
