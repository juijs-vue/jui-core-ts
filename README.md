# jui-core-ts

Framework-agnostic TypeScript port of [`juijs/jui-core`](https://github.com/juijs/jui-core)'s utility layer, for
the Vue 3 / TypeScript `jui-*` family (`jui-ui-vue`, `jui-chart-vue`, `jui-graph-ts`, `jui-grid-vue`) — no
jQuery, no DOM-selector-driven component system. See `PORT_STATUS.md` for the full rationale and a list of
deliberate deviations from a byte-faithful port.

- **Utilities** (`src/utils/*`) are plain, tree-shakeable ES modules exporting typed functions/classes directly.
  There is no dynamic string-based module registry (`jui.include("util.color")`) - just
  `import { rgb } from "jui-core-ts"`.
- **`UICore`** (`src/core/UICore.ts`) is a small, DOM-free base class for a component's state/custom-event logic
  (`emit`/`on`/`off`, `addValid`/`callBefore`/`callAfter`/`callDelay`, default-option merging via each
  ancestor's static `setup()`). It intentionally does **not** know how to find DOM elements or bind DOM events -
  that responsibility belongs to whatever framework renders the component. The intended pattern:

  ```ts
  interface TableOptions extends UIOptions {
    fields: string[]
  }

  class TableCore extends UICore<TableOptions> {
    static override setup(): TableOptions {
      return { fields: [] } as TableOptions
    }
    // ...state/business logic, this.emit(...) for custom events...
  }

  // in a Vue composable:
  const core = new TableCore({ fields: ['id', 'name'] })
  core.on('rowClick', (row) => { /* update reactive state */ })
  ```

## Known intentional behavior changes vs. the original

- `MathUtil.inverseMatrix3d`'s legacy out-of-bounds write (`te[3][4]` on a 4-element `Float32Array`) is fixed to
  `te[3][3]`.
- `trim()`'s old jQuery-derived regex, which ate characters out of the middle of a string
  (`trim("  hi  ")` -> `"h"`), is fixed to a plain leading/trailing-whitespace strip.
- Dead IE/legacy-browser branches (`ActiveXObject`, `attachEvent`, the jQuery-derived DOM-ready polyfill) were
  dropped in favor of standard APIs.
- The DOM-selector-driven component builder (`jui.defineUI`, `UICore.build`/`UIEvent.build`,
  `UIManager`/`UICollection`) and jQuery-backed `UIEvent` are dropped entirely - see `PORT_STATUS.md` for why.

## Scripts

- `npm run build` - type declarations (`tsc`) + `cjs`/`esm`/`iife` bundles (`rollup`)
- `npm test` - Jest (ts-jest, jsdom)
- `npm run typecheck` - `tsc --noEmit`
