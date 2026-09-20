# jui-core-ts — port status

`jui-core-ts` is a TypeScript port of [`juijs/jui-core`](https://github.com/juijs/jui-core)
(cloned locally at `/home/search5/cl/jui-core`, MIT, `seogi1004`/JenniferSoft) — historically the shared
foundation `jui-grid`/`jui-ui` depended on at runtime (`juijs: ^2.3.0`), and the source `jui-graph`'s
`base/base.js`/`util/{math,color,dom}.js` were near-byte-identical forked copies of (see
`/home/search5/cl/jui-graph-ts/PORT_STATUS.md`'s "Deferred follow-up: jui-core-ts" section, written before
this work started).

## Why this looks different from a straight port

This port went through two shapes in the same session:

1. **First pass**: a faithful-ish port that kept the original's DOM-selector-driven component system —
   `UICore`/`UIEvent` (jQuery-backed), `UICollection`, `UIManager`, and a `Registry` replacing
   `jui.defineUI`/`jui.include`.
2. **Re-scoped pass (this one)**: the user pointed out that every live sibling (`jui-ui-vue`, `jui-chart-vue`,
   `jui-graph-ts`, `jui-grid-vue`) has already moved to Vue 3 Composition API and dropped jQuery entirely — none
   of them use, or want, a `document.querySelectorAll` + global-instance-registry component system, because Vue
   already owns component mounting/unmounting/DOM-event-binding. Checking the actual old jQuery consumer
   (`jui-grid`) confirmed this wasn't just a Vue-side assumption: of its whole `src/` tree, only two files
   (`components/table.js`, `components/xtable.js`) ever did `extend: "event"` to inherit `UIEvent` — the
   DOM-selector builder was a thin, optional layer even in the original, not jui-core's real value. Its real
   value was the utility layer (`typeCheck`/`extend`/`clone`/math/color/dom/template/etc.), which is exactly
   what's hand-duplicated today across `jui-graph-ts/src/util/*`, `jui-chart-vue/src/composables/*Util.ts`, and
   `jui-ui-vue/vue/src/utils/*`.

So the final shape:

- **Kept, unchanged in spirit**: every `util/*` module, ported as plain typed functions/classes (`src/utils/*`).
- **Kept, redesigned**: `UICore` (`src/core/UICore.ts`) — the custom event emitter (`emit`/`on`/`off`) and
  method-wrapping helpers (`addValid`/`callBefore`/`callAfter`/`callDelay`) never touched the DOM in the
  original either, so they survive as a real, framework-agnostic `class` other code can `extends`. Its
  constructor now also does what `jui.defineOptions`/`UICore.build` used to do externally: merge default options
  declared via every ancestor's static `setup()`. The intended consumption pattern: a Vue-side package like
  `jui-grid-vue` writes `class TableCore extends UICore<TableOptions> { ... }` for the framework-agnostic
  state/business logic that used to live in `jui-grid`'s `table.js`, and a composable wraps
  `new TableCore(options)`, binding `core.emit`/`core.on` into Vue's reactive state and template refs.
- **Dropped entirely**: `UIEvent` (jQuery `find`/`addEvent`/`addTrigger` DOM-event binding — Vue's own
  `@click`-style directives replace this), `UICollection`/`UIManager`/`Registry`
  (`jui.defineUI`/`document.querySelectorAll`-driven multi-instance builder + global registry — Vue's component
  mount/unmount lifecycle replaces this), and the `jquery`/`@types/jquery` dependencies.
- **`jui.include`/`jui.use`'s runtime string-keyed module registry**: dropped from the start of this port (both
  passes) in favor of real `import`/`export` — this matches Phase 0 rule 1 below and was never reconsidered.

## Phase 0 rules adopted from jui-graph-ts (with two explicit deviations)

`jui-graph-ts/PORT_STATUS.md`'s "Phase 0 — Architecture decisions" section pre-dates this port and was written
with an eye toward reconciling with a future jui-core-ts. Rules adopted as-is:

1. No runtime module registry — real `import`/`export` only.
2. `extend` chains become real `class ... extends ...` (`UICore`), constructor/method names kept 1:1 with the
   original where one exists (e.g. `emit`/`on`/`off`/`addValid`/`callBefore`/`callAfter`/`callDelay`/`setTpl`/
   `setOption`/`destroy` all keep their original names).
3. Pure utility namespaces (`math`, `color`, `dom`, etc.) stay plain exported functions, not classes. `sort.ts`
   (`QuickSort`) and `keyParser.ts` (`KeyParser`) stay classes because they're stateful single-purpose utilities
   in the original too (constructor + instance methods), not "grab bags of functions" — same distinction the
   rule itself draws.
4. `util/base.js`'s `inherit()` is dropped outright (real `class extends` replaces it, and it was never ported).
   `typeCheck`/`extend`/`clone`/`deepClone` are **kept**, deliberately deviating from jui-graph-ts's Phase 0 rule
   4 ("TS's type system replaces them outright") — the user's call: these still do real work at runtime
   (validating/merging option objects coming from outside the type system, e.g. CSV/dynamic option input), where
   TS's static types provide no runtime guarantee. `browser.webkit`/`.mozilla`/`.msie` sniffing is dropped
   (genuinely dead, matches the rule); `isTouch` is kept as a plain exported utility even though its only
   internal caller (`UIEvent`'s touch-event remapping) is gone — cheap, self-contained, and a Vue component
   author may still want it.

Deviations, both deliberate:

- **Rule 6 ("preserve bugs/quirks byte-faithfully, don't fix, just document") is not followed here.** Two bugs
  were fixed instead of preserved:
  - `util.base`'s `trim()` used an old jQuery-derived regex
    (`/^[\x20\t\r\n\f]+|((?:^|[^\\])(?:\\.)*)[\x20\t\r\n\f]+$/g`) that, combined with the `g` flag, eats
    characters out of the *middle* of the string (`trim("  hi  ")` → `"h"`, not `"hi"`). Fixed to a plain
    leading/trailing-whitespace strip in `src/utils/object.ts`.
  - `math.inverseMatrix3d`'s legacy implementation had an out-of-bounds write (`te[3][4]` on a 4-element
    `Float32Array`) that silently dropped the `te[3][3]` term. Fixed in `src/utils/math.ts`.

  Rationale: rule 6 exists in jui-graph-ts because that port's numeric engine gets cross-verified against
  jui-chart-vue's hand-traced expected outputs — preserving exact original arithmetic (bugs included) is what
  makes that verification meaningful. Neither bug here is exercised by any downstream hand-traced test suite;
  preserving them would only carry forward two footguns for zero verification value. Both are called out here
  and in code comments instead of silently patched.
- **Rule 7 ("one TS file per original source file, same relative path") is not followed here.** The original
  `base/base.js` (a ~1200-line grab-bag: type-checking, object utils, CSV, dates, ajax, DOM-ready, the module
  registry, and the `jui` singleton) is split into focused modules (`typeCheck.ts`, `object.ts`, `csv.ts`,
  `date.ts`, `ajax.ts`, `ready.ts`, `browser.ts`) instead of one mirrored `base.ts`. At jui-core-ts's scale (13
  original files, no numeric engine to diff line-by-line against), the readability win of focused modules
  outweighs rule 7's auditability goal, which mattered much more for jui-graph-ts's 55-file numeric port.

## Third pass: full-fidelity `util.base`/`util.math`/`util.color`, regardless of observed call volume

A follow-up session cross-checked real call-site volume for every `util.base`/`util.math`/`util.color`
function across `jui-grid`+`jui-chart`+`jui-graph` (combined). Several functions had zero direct external call
sites in those three repos: `chunk`, `makeIndex`, `pxToInt`, `endsWith`, `dataToCsv`/`dataToCsv2`, `param`,
`btoa`/`atob`, `timeLoop`, `resize` (window-resize debounce, `util.base`'s version — distinct from
`math.resize`), `scrollWidth`, `runtime`, `inverseMatrix3d`, `minus`, `remain`, `getFixed`, `round`, `format`,
`map`, `HSVtoRGB`/`RGBtoHSV`, `parseGradient`, `colorHash`.

**Decision: this is not a cut list.** Low/zero call-site count in three specific repos says nothing about
whether some other consumer (jui-grid's own `juijs-ui: ^2.3.3` dependency, not locally cloned; a future
`jui-*-vue` package; a hand-written app) needs a given function — and because `sideEffects: false` +
tree-shaking makes an unused export free at bundle time for every consumer, there's no cost to keeping the
full original API surface. `util.math`/`util.color` were already 100% ported (every function above was already
present in `src/utils/math.ts`/`color.ts` before this pass — the "0 call sites" finding was informational, not
something already cut). `util.base` had real gaps, filled in this pass:

- `resize`/`scrollWidth` → `src/utils/dom.ts` (both DOM-facing; `resize`'s IE `attachEvent` branch dropped per
  Phase 0 rule 4 - `window.addEventListener` is universal now).
- `runtime` → new `src/utils/perf.ts`.
- `btoa`/`atob` (the `util.base`-level wrappers around `Base64.encode`/`decode`) → `src/utils/base64.ts`.
- `loop`/`loopArray`/`timeLoop` → new `src/utils/loop.ts`, ported faithfully including the 5-lane interleaving.

Also applied, per the same pass's comparison against `jui-graph-ts`'s/`jui-chart-vue`'s already-hand-ported
utils (found via diffing signatures, not call-site volume):

- `color.rgb()` no longer throws on unrecognized input - it passes through unchanged (a string or an
  already-parsed `RGBColor`), matching the original (`return str` at the end, no throw) and `jui-graph-ts`'s
  `rgb()`, which accepts a pre-parsed color as a no-op passthrough.
- `color.colorHash(name, callback?)` - restored the optional `callback` parameter (`callback(vector)` instead
  of the default RGB mapping), matching the original and `jui-graph-ts`.
- `color.parseAttr`/`color.parseStop` - made public exports (previously module-private), matching
  `jui-graph-ts` and `jui-chart-vue`, both of which use/expose these independently.

## Scope check against the four live siblings

- `jui-graph-ts/src/util/{math,color,dom}.ts` — independently hand-ported already; not reconciled into a
  runtime dependency on `jui-core-ts` in this pass (that's `jui-graph-ts`'s own migration to do later, per its
  own PORT_STATUS.md "reconcile... retroactively" note). Worth cross-checking numeric outputs against
  `src/utils/math.ts`/`color.ts` here when that happens.
- `jui-chart-vue`'s `ColorUtil.parseGradient`/`parseAttr`/`parseStop` (confirmed real/used, per its own
  `PORT_STATUS.md`) — ported here in `src/utils/color.ts`.
- **`jui-ui-vue` — reconciled.** `vue/package.json` now depends on `"jui-core-ts": "file:../../jui-core-ts"`.
  `vue/src/utils/color.js` and `vue/src/utils/treeIndex.js` are deleted outright;
  `Colorpicker.vue`/`Datepicker.vue`/`Tree.vue` import `rgb`/`format`/`HSVtoRGB`/`RGBtoHSV`/`scale`/
  `dateFormat`/`KeyParser` from `jui-core-ts` directly, renamed from their old independent
  `parseColor`/`formatColor`/`hsvToRgb`/`rgbToHsv`/`colorScale`/flat-function-`treeIndex` names.
  `vue/src/utils/date.js` keeps only `getStartDate`/`getLastDate` (calendar-specific helpers with no jui-core
  equivalent); `dateFormat` itself moved to `jui-core-ts`. One deliberate behavior preservation: jui-core-ts's
  `format(..., "hex")` returns uppercase (matching the original `util.color.format`), but Colorpicker's
  existing UI/tests expect lowercase hex - `Colorpicker.vue` wraps it in a local `formatColor()` that
  lowercases, rather than changing visible product behavior under the banner of a rename. All 225
  `jui-ui-vue` tests and all 98 downstream `jui-grid-vue` tests pass unchanged.
  - This migration surfaced two real jui-core-ts bugs, now fixed: (1) `package.json` had no `exports` map,
    so Node/Vite's ESM resolution algorithm treated `dist/jui-core.cjs.js` (real CJS content) as ESM because
    of the package's own `"type": "module"`, silently yielding an empty module with every import `undefined`
    - fixed by adding an `exports` map and renaming the CJS output to `dist/jui-core.cjs` (unambiguous
    extension). (2) `color.ts` was only re-exported as the `ColorUtil` namespace
    (`export * as ColorUtil from './color.js'`), not flat - so `import { rgb } from 'jui-core-ts'` silently
    resolved to `undefined` even after fix (1). Now flat-exported too (`export * from './color.js'`), in
    addition to keeping the `ColorUtil` namespace alias; confirmed no name collisions with it exist among the
    other flat-exported modules (math/dom stay namespace-only since they collide with each other on `resize`).
- **`jui-graph-ts` — reconciled (partially, deliberately).** Now depends on
  `"jui-core-ts": "file:../jui-core-ts"`. Its `src/util/math.ts` delegates the byte-identical subset
  (`rotate`/`resize`/`radian`/`degree`/`angle`/`interpolate*`/`getFixed`/`round`/`plus`/`minus`/`multi`/`div`/
  `remain`/`scaleValue`) to this package's `MathUtil`; `fixed`/`nice`/`matrix`/`matrix3d`/`inverseMatrix3d` stay
  local there (jui-graph-ts preserves the original's `nice()`/`inverseMatrix3d()`/`fixed().div()` bugs
  byte-faithfully - this package fixed two of those three, so delegating them would have broken jui-graph-ts's
  own regression tests). `src/util/color.ts` delegates `format`/`rgb`/`scale`/`map`/`HSVtoRGB`/`RGBtoHSV`/
  `lighten`/`darken`/`colorHash` similarly; `parseGradient`/`parseStop`/`parseAttr` stay local there - see the
  next bullet, this is where a real fidelity gap in *this* package's own port was found. `src/util/dom.ts` was
  left alone entirely (its local `find`/`attr`/`each` gracefully degrade on malformed input in a way this
  package's `dom.ts` doesn't). Full writeup with the exact reasoning per function: jui-graph-ts's own
  `PORT_STATUS.md`, "jui-core-ts reconciliation" section. All 934 jui-graph-ts tests and (transitively, via its
  own already-existing `jui-graph-ts` dependency) all 732 jui-chart-vue tests still pass unchanged - neither
  needed further changes; jui-chart-vue's `composables/mathUtil.ts`/`colorParser.ts` had already, independently,
  made the identical "delegate the safe subset, keep the buggy/bug-preserving parts local" call.
- **Fidelity gap found and documented (not fixed) in this package's own `color.ts`**: `parseStop` was intended
  as a faithful port of the original's gradient-stop interpolation, but the original has a real bug where the
  "fill in missing offsets" pass reads/writes a top-level `stop.offset` field that's never the same as the
  `stop.attr.offset` actually populated during parsing (see jui-graph-ts's and jui-chart-vue's independent,
  hand-traced writeups of the same bug - jui-chart-vue's `colorParser.ts` even confirms it can throw for a
  3+-stop gradient with an interior gap). This package's `parseStop` unintentionally unifies both into
  `attr.offset`, which happens to produce more sensible output but is neither the original's behavior nor
  something previously called out as an intentional fix (unlike `trim()`/`inverseMatrix3d`, both documented
  above). Left as-is (the unified behavior is arguably better and nothing in this repo depends on the original
  bug), but now documented rather than silently divergent.
