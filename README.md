# ProgBlocks

**A dependency-free web component for rich code blocks in technical documentation — pre-alpha, and not currently functional.**

## What this is

ProgBlocks is a single custom element, `<prog-block>`, meant to render variant-switchable,
variable-substituted code blocks for documentation and wikis: pick an OS/shell/language tab, fill in
`{{ variables }}`, paste in data and have it auto-detected as an array or matrix, export the result.
Conceived for [BerryWiki](https://github.com/metadatastician/berrywiki) and decoupled by design so it
can be injected into `ddraig-ssg` output, `nextgen-languages` previewers, or plain Markdown sites. What
follows is what actually exists, not the pitch — for the itemised, evidence-backed version see
[`AUDIT.adoc`](./AUDIT.adoc) (verified vs. asserted vs. explicitly-not-claimed) and
[`DEBT.adoc`](./DEBT.adoc) (known defects, with status).

## Status

**Pre-alpha. Nothing has been released.** Version numbers disagree with each other and none of them mean
anything yet: `package.k9` and `contracts.ncl` say `1.0.0`; `progblocks.launcher.a2ml` and
`progblocks-launcher.sh` say `0.1.0`; `package.json` says `0.3.0`. Treat all three as noise.

**The component registers.** `src/prog-block.js` used to import a name, `validateK9`, that
`src/k9-validator.js` did not export (it exports `K9Validator` and `defaultValidator`). That was a
link-time ES module error — loading the file threw before `customElements.define('prog-block', …)` was
ever reached, so every `<prog-block>` on `index.html` was inert. The import has been fixed (it now
imports `defaultValidator`) and a regression test guards against it recurring:

```
$ npm test
✔ <prog-block> registers and constructs as a real HTMLElement
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

`tests/registration.test.js` asserts `customElements.get('prog-block')` is defined after the module
loads — the class of bug that made every `<prog-block>` inert can no longer land silently.

Several features claimed by earlier revisions of this README were never implemented and have been
removed rather than left to rot unfixed: a code/preview toggle, templating wizards, a live linter, and
WCAG **AAA** accessibility (the honest target is AA, and even that has gaps — see the table).

## Try it

Open `index.html` in a browser.

**Stylesheet path caveat:** the component injects `<link rel="stylesheet" href="./src/prog-block.css">`
into its own shadow root on every render. That relative path resolves against the *hosting document's*
URL, not the component module's URL — so it only finds the stylesheet when the host page sits exactly
one directory above a sibling `src/`, i.e. laid out like this repository's own `index.html`. Embed
`<prog-block>` in a page at any other depth and the shadow tree renders unstyled, with no error. See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for why.

## Features

| Feature | Status | Notes |
|---|---|---|
| Custom element registers | Works | `customElements.define()` runs and `customElements.get('prog-block')` is defined; guarded by `tests/registration.test.js` — see Status above |
| Variant tabs (OS/shell/language) | Partial | Generic tablist only: no OS/shell/language semantics, no platform detection, no cross-block sync, no persistence |
| A2ML variable substitution | Partial | Plain regex over variant content, with generated `<input>`s; not backed by the A2ML parser (which is a stub — see below) |
| Editing a variable value | **Broken** | Every keystroke triggers a full `shadowRoot.innerHTML` rewrite, destroying and recreating the `<input>` you're typing into — multi-character values are effectively untypeable |
| Editing code inline | **Broken** | Typing in the code editor overwrites the variant source with *post-interpolation* text, permanently losing `{{ vars }}` (self-confessed in a code comment) |
| Preview toggle (code view / preview view) | **Absent** | The advertised toggle does not exist |
| Templating wizards | **Absent** | No storage, no forms, no wizard code anywhere |
| Live linter | **Broken** | The rendered panel is the hardcoded string `<i>Linter ready</i>`; the real WebSocket/LSP code lives in `view-manager.js`, which nothing imports |
| Split view (side-by-side / top-bottom) | **Broken** | CSS matches `:host([split-view="…"])`; the JS only stamps the value on an inner `<div>`, never on the host, so the selector never matches |
| Smart paste | Partial | Detects JSON arrays and CSV/TSV matrices, falls back to plain text; no tuple support |
| Export to file (JSON/CSV/Nickel/TXT) | Partial | Downloads a file, but "CSV" quotes each whole line as a single field (no delimiter splitting) and "JSON" just wraps the raw text in `{"block_content": "…"}` — neither is a real structured export |
| Line numbers | Partial | Renders correctly (`user-select:none`, `aria-hidden`, clipboard-clean) via the `line-numbers` host attribute; no toggle control exists in the UI |
| Accessibility | Partial | AA-target, not the previously-claimed AAA. Present: `role=tablist/tab`, `aria-selected`, `aria-pressed`, `aria-label`, `aria-hidden` line numbers, `:focus-visible`. Missing even for AA: roving `tabindex`/arrow-key tablist nav, `tabpanel`+`aria-controls` pairing, `aria-live` on state changes; inactive tabs sit at `opacity:0.7`, degrading contrast; a defined `.sr-only` CSS class is never referenced by any element |
| A2ML parser (tree-sitter/WASM) | **Absent** | `assets/tree-sitter-a2ml.wasm` is a 118-byte text placeholder, not WebAssembly; the tree-sitter code path is commented out; the parse function is imported but never called |
| K9 / Nickel validation triad | **Broken** | `validateNickel()` fakes a 50ms delay then always returns `valid:true`; `executeJustTask()` logs and returns `true` unconditionally; neither has a call site anywhere in the source |
| Escaping / sanitising untrusted content | **Absent** | Variant content and variable values are interpolated as raw HTML with no escaping anywhere in the source — a live injection surface for a component whose job is rendering pasted documentation snippets |

## Documentation

| Document | What it answers |
|---|---|
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | The module map, the render model and why it's a problem, the shadow-DOM styling limitation, and how variants/variables/render fit together |
| [`AGENTS.md`](./AGENTS.md) | What this repo is, the canonical read order, and the hard do-nots |
| [`EXPLAINME.adoc`](./EXPLAINME.adoc) | Every substantive claim this project makes, mapped to the file/line that implements it and the test that evidences it — or "no automated evidence" where there is none |
| [`AUDIT.adoc`](./AUDIT.adoc) | What is verified, what is merely asserted, and what is explicitly *not* claimed |
| [`DEBT.adoc`](./DEBT.adoc) | Known debt by kind, with evidence and status (OPEN / FLAG-ONLY / ACCEPTED) |
| [`CHANGELOG.md`](./CHANGELOG.md) | Project history — currently all `[Unreleased]` |
| [`SECURITY.md`](./SECURITY.md) | Threat model and how to report an issue |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | How to work on this repo |
| [`GOVERNANCE.md`](./GOVERNANCE.md) | How decisions get made |
| [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md) | Expected conduct and how to report a problem |
| [`0-AI-MANIFEST.a2ml`](./0-AI-MANIFEST.a2ml) | Machine-readable entry point for agents |
| [`.machine_readable/descriptiles/STATE.a2ml`](./.machine_readable/descriptiles/STATE.a2ml) | Machine-readable current-state descriptile |
| [`docs/wiki/Home.adoc`](./docs/wiki/Home.adoc) | The in-repo wiki landing page — canonical; the GitHub wiki for this repo is a 32-byte stub that should point here |

## Development

```sh
just test    # node --test — runs tests/prog-block.test.js and tests/registration.test.js
just check   # nickel export contracts.ncl — requires Nickel on PATH
npm test     # same as `just test`, via package.json
```

**`just test` can now fail honestly.** The recipe is `node --test` (`Justfile:17`) with no fallback —
a failing test run exits non-zero. `tests/registration.test.js` is the test that would have caught the
fatal import bug described in Status; it now runs as part of the suite (5 tests, all passing).

## Licence

[MPL-2.0](./LICENSE). Historic conflicting licence claims — AGPL in a stray `settings.yml`, CC-BY-SA in
the launcher A2ML — were resolved to MPL-2.0 in PR #15. SPDX headers estate-wide are MPL-2.0.

## Origin

Conceived for [BerryWiki](https://github.com/metadatastician/berrywiki); decoupled by design so it can
be injected into `ddraig-ssg` output, `nextgen-languages` previewers, or plain Markdown sites. Part of
the Hyperpolymath / Metadatastician ecosystem.
