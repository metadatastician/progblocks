# ProgBlocks architecture

This describes the code as it exists in this checkout, not the design it was meant to reach. See
[`README.md`](./README.md#status) for why the component currently fails to load at all, and
[`EXPLAINME.adoc`](./EXPLAINME.adoc) for claim-by-claim evidence.

## Module map

| File | Lines | Responsibility |
|---|---|---|
| `src/prog-block.js` | 247 | The `<prog-block>` custom element — the entire component. Constructor, lifecycle callbacks, state, light-DOM parsing, A2ML variable extraction/interpolation, HTML rendering, event binding all live in this one file. |
| `src/prog-block.css` | 182 | Shadow-DOM stylesheet, loaded via a `<link>` injected into `shadowRoot.innerHTML` on every render (see "Shadow-DOM styling" below). |
| `src/modules/exporter.js` | 65 | `exportBlockData()` — builds a `Blob` and triggers a file download for JSON/CSV/Nickel/TXT. Called from `handleExport()`. The CSV and JSON encodings are not structurally real (see `README.md`'s Features table); the module is otherwise wired in and does run. |
| `src/a2ml-parser.js` | 60 | **Stub.** Exports `A2MLState` (a pub/sub variable store) and `parseA2ML()` (an async function). `A2MLState` is never instantiated anywhere in `src/`. `parseA2ML()`'s tree-sitter/WASM body is entirely commented out and falls through to the same `{{ key }}` regex substitution `prog-block.js` already does inline. `prog-block.js:2` imports `parseA2ML` but never calls it — grep confirms no call site. |
| `src/modules/view-manager.js` | 55 | **Entirely dead.** Exports `ViewManager`, whose methods (`setSplitView`, `toggleLineNumbers`, `attachLinterPanel`) contain the *real* split-view and WebSocket/LSP-linter logic — but nothing imports `view-manager.js`, not `prog-block.js`, not `index.html`. It is unreachable code. |
| `src/k9-validator.js` | 54 | `K9Validator` class (`checkMust`, `validateNickel`, `executeJustTask`) plus a `defaultValidator` instance. `checkMust()` does a real (if trivial) `customElements` feature check; `validateNickel()` and `executeJustTask()` are fakes (see `EXPLAINME.adoc`). None of the three has a call site in this checkout — `prog-block.js:2` imports `{ defaultValidator }` (previously imported the non-existent `validateK9`, a fatal link-time bug that has been fixed — see `README.md`) but never calls any method on it. |
| `src/modules/smart-paste.js` | 53 | `parsePaste()` — detects JSON arrays and CSV/TSV matrices from a paste event, falls back to plain text. Called from `handlePaste()`. This is the one module with automated test coverage (`tests/prog-block.test.js`). |
| `index.html` | 48 | Demo page. Two `<prog-block>` elements with `<template data-variant="…">` children, loading `src/prog-block.js` as an ES module script. |
| `contracts.ncl` | 20 | Nickel self-description: version, entry points, styles, A2ML dialect version, an `accessibility_standard` field (corrected 2026-08-07 from a false `WCAG_AAA` assertion to `WCAG_2.1_AA_target`). It type-checks its own text only — it does not verify that the paths it names exist. See `DEBT.adoc` T4. |
| `package.k9` | 20 | Declarative K9 manifest (Must/Just/Nickel triad). Nothing in `src/` consumes it. |
| `progblocks-launcher.sh` | 467 | **Generated** by `launch-scaffolder` from `progblocks.launcher.a2ml`. Marked "do not edit" in its own header. Currently non-functional for unrelated reasons (an upstream generator bug) — not part of the component's runtime architecture. |
| `assets/tree-sitter-a2ml.wasm` | — | 118-byte ASCII text file reading `// Dummy WASM file placeholder`, not a compiled WebAssembly module. |

No runtime dependencies. Two dev dependencies, `happy-dom` and `@happy-dom/global-registrator` (see
`package.json`), used by `tests/registration.test.js`. Node ≥ 20, ESM
throughout — every `src/` file uses `import`/`export`.

## Custom-element lifecycle

`ProgBlock extends HTMLElement`, registered at the bottom of `prog-block.js:247` as
`customElements.define('prog-block', ProgBlock)`.

- **`constructor()`** (8–24): calls `attachShadow({ mode: 'open' })` and initialises `this._state`, a
  plain object holding `variants`, `activeVariantId`, `variables` (a `Map`), `language`,
  `showLineNumbers`, `splitView`, `linterEnabled`, `lspSocket`, and `linterHtml` (hardcoded to
  `'<i>Linter ready</i>'` — see the live-linter entry in `EXPLAINME.adoc`).
- **`connectedCallback()`** (26–29): calls `parseLightDOM()` then `render()`. This is the component's
  real entry point once an instance exists — but in this checkout no instance is ever constructed in a
  browser, because the module itself fails to load (see README Status).
- **`static get observedAttributes()`** (31–33): `['language', 'line-numbers', 'split-view',
  'glyph-mode']`.
- **`attributeChangedCallback()`** (35–47): routes each observed attribute change into `updateState()`,
  with `line-numbers` converted to a boolean and `glyph-mode` re-stamped as a boolean attribute.
- **`updateState(newState)`** (49–52): `this._state = { ...this._state, ...newState }` followed by an
  unconditional `this.render()`. This one method is the render trigger for *everything* — attribute
  changes, tab clicks, variable edits, the linter toggle all funnel through it, and all of them cause
  the same full re-render described below.

## Render model — and why it is a problem

`render()` (137–208) computes the active variant's interpolated content, builds four HTML fragments
(line numbers, tabs, the A2ML variable panel, the linter panel) as template-literal strings, and does a
single assignment:

```js
this.shadowRoot.innerHTML = `...`;   // prog-block.js:177
```

covering the *entire* shadow tree, followed by `bindEvents()` (210–244), which re-queries and
re-attaches every listener from scratch. There is no diffing and no partial update path — every state
change, however small, discards and rebuilds the whole shadow DOM.

This is not a cosmetic inefficiency; it produces concrete, user-facing defects:

- **Focus loss on every keystroke.** `handleVarChange()` (95–99) → `updateState()` (49–52) →
  the full `shadowRoot.innerHTML` rewrite (177). Editing a variable's `<input>` fires an `input` event
  on every character; each one destroys and recreates that same `<input>` node. Focus does not survive
  a wholesale `innerHTML` swap, so multi-character values are effectively untypeable through the UI.
- **The editor destroys A2ML templates.** The `.code-content` `input` listener (234–242) overwrites the
  active variant's stored `content` with `e.target.textContent` — the *post-interpolation* text, with
  variables already substituted — permanently losing the `{{ var }}` placeholders. Self-confessed in a
  comment at line 238: "Careful: if A2ML vars exist, typing over them destroys the template tag!"
- **Unescaped HTML injection.** Variant `<template>` content is read via `t.innerHTML` (60) and later
  re-injected as raw HTML inside `.code-content` (199, part of the same template-literal rewrite);
  variable values interpolate unescaped into the `value="${val}"` attribute of generated `<input>`s
  (165). No escaping or sanitising function exists anywhere in `src/` (verified by grep). For a
  component whose purpose is rendering pasted documentation snippets, this is a live injection surface.
- **Falsy variable values render wrong.** `interpolateContent()`'s substitution is
  `this._state.variables.get(key) || match` (91) — a value of `""` or `"0"` is falsy, so it falls back
  to re-displaying the raw `{{ placeholder }}` instead of the actual (empty or zero) value.
- **Variables accumulate forever.** `extractA2MLVariables()` (76–86) merges newly seen keys into the
  existing `_state.variables` Map and never removes any — switching between variant tabs keeps every
  variable name ever encountered across every previously visited variant, for the lifetime of the
  element.

## Shadow-DOM styling — and its embedding limitation

The stylesheet is injected as `<link rel="stylesheet" href="./src/prog-block.css">` inside the
`shadowRoot.innerHTML` template on every render (`prog-block.js:178`). A relative `href` inside a
shadow tree resolves against the *hosting document's* URL, not the component module's own URL. That
means the stylesheet only loads correctly when the page embedding `<prog-block>` happens to sit exactly
one directory above a sibling `src/prog-block.css` — i.e. laid out exactly like this repository's own
`index.html`. Any other embedding — a documentation site pulling the component from a different path, a
CDN bundle, a different repo layout — silently fails to load the stylesheet; the shadow tree renders
unstyled with no error. This directly undermines the "decoupled, inject into any system" design goal
stated in the README's "What this is" section.

## Data flow: variants → variables → render

1. `connectedCallback()` → `parseLightDOM()` (55–73): reads light-DOM `<template data-variant="…">`
   children into `_state.variants` (`[{ id, name, content }]`), or falls back to the element's raw
   `innerHTML` as a single `'default'` variant if no templates are present. Sets `activeVariantId` to
   the first variant and calls `extractA2MLVariables()` on its content.
2. `extractA2MLVariables(content)` (76–86): regex-scans for `{{ key }}` tokens
   (`/\{\{\s*([\w:-]+)\s*\}\}/g`) and seeds `_state.variables` with an empty-string default for any key
   not already present. Runs again on every `handleTabClick()`, and never prunes stale keys (see above).
3. `render()` (137–208): looks up the active variant, calls `interpolateContent()` to substitute
   `{{ key }}` → the variable's current value (or leave the placeholder if the value is falsy), builds
   the HTML fragments, and performs the single `shadowRoot.innerHTML` rewrite.
4. User interaction — clicking a tab (`handleTabClick`, 101–107) or editing a variable
   (`handleVarChange`, 95–99) — both call `updateState()`, which re-runs the whole of step 3
   unconditionally. There is no "just swap the active tab" path distinct from "rebuild everything."

## Intended vs. actual

**Intended** (per `contracts.ncl`, `package.k9`, and the pre-rewrite README): variant switching with
real OS/shell/language/citation-style semantics; a WYSIWYG code/preview toggle; a live,
LSP-backed linter panel; a real tree-sitter A2ML parser compiled to WASM; WCAG AAA accessibility;
structured JSON/CSV export; a K9 Must-Just-Nickel validation triad checking the block's state against
Nickel contracts.

**Actual** (this checkout): one 247-line file doing full-string-template shadow-DOM rendering on every
state change; `a2ml-parser.js` and `view-manager.js` are stub and dead code respectively, never wired
into the render path; the linter panel is a hardcoded string; two of `k9-validator.js`'s three methods
are fakes with no call site; export is a `Blob` download whose CSV/JSON encodings do not actually parse
or reconstruct structure; and, as of this checkout, the module fails to load at all because of one bad
import name, so none of the above executes in a browser until that is fixed.
