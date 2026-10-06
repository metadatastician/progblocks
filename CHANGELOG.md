# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Nothing has been released. There is no tagged version and no published package; everything below is
`[Unreleased]`. Every version field in this repo says `0.3.0` (aligned 2026-10-05, after `1.0.0`,
`0.1.0` and `0.3.0` had drifted apart across files). That is a pre-release number, not a prior release.

## [Unreleased]

### Added

- Group-sync announcements: a reader's variant change that switches other blocks in the same `group` is
  announced once through the `role=status` region of the block they used ("Also switched 1 other example
  to Windows"), and a choice followed from another tab is announced once by the first block that
  followed. Programmatic and restored changes stay silent (RELEASE-CRITERIA A2).
- `tests/property.test.js`: seeded property tests (in-file mulberry32 generator, no new dependency)
  over `tokenize()` and rendering — round-trip text, segment shape, and a code panel holding exactly
  the substituted text with no authored element, and a generator-oracle check that one variable
  between plain text is recognised and substituted (RELEASE-CRITERIA S6).
- Repo deed `.machine_readable/descriptiles/progblocks_chora.deed` (DEED grammar, linted with
  `deed_lint.py`): the single machine-readable record of the repo, replacing every `.a2ml` file.
  Its identity carries a UUID v8 profile C twin (`3a8b147b-7006-8d01-9edb-c29c4d6551bb`,
  ADR-008, adopted ahead of ratification) beside the grammar-required v5 `:repo-uuid`.
- `progblocks.launcher_praxis.deed`, the per-app launcher descriptor in launch-scaffolder's #42 form.
- `tools/jcs.mjs`: RFC 8785 (JCS) canonicaliser and RFC 7493 (I-JSON) checker, cross-checked
  byte-for-byte against the `ijson-jcs` CLI and the RFC 8785 §3.2.3 sample; `tests/jcs.test.js`;
  a CI step that fails on any non-canonical tracked `.json`.

- Variant switching completed: WAI-ARIA tabs keyboard model (arrows with wrap, Home, End), roving
  `tabindex`, `tabpanel` with `aria-controls`/`aria-labelledby`; `variant`, `group` and `label`
  attributes; `group` keeps every block on a page showing the same variant.
- Variable defaults with `{{ name = default }}`; one labelled input per variable shared across variants.
- Copy and Download (plain text, `filename` attribute) buttons, with the outcome announced through a `role=status` live region.
- Embedding API: `variant`, `text`, `getVariable()`, `setVariable()`, `refresh()`, the `progblocks:variant-change`
  and `progblocks:variable-change` events, and `::part()` names.
- `just a11y` (`tools/a11y-audit.mjs`): axe-core audit of the demo in a real Chromium, exiting 1 on
  any violation; CI runs it in the `build` job. Dev dependencies `axe-core` and `playwright-core` (no bundled browser).
- `persist` attribute (with `group`): the reader's variant choice is stored in `localStorage` under
  `progblocks:variant:<group>` and restored on the next page load, ahead of `variant`. Only
  reader-initiated selections are stored; blocked storage degrades silently to page-local sync; other
  open tabs follow via the `storage` event, without echo. The demo page uses it.
- Live authored content: a `MutationObserver` re-reads the light DOM when templates or text change and
  rebuilds the block (one rebuild per microtask), keeping the selected variant and the reader's values.
  New `refresh()` method for edits to a `<template>`'s `.content`, which observers cannot see.
- `tests/component.test.js` (32 behavioural tests) and `tests/helpers/dom.js`.

- `.gitignore` and the MPL-2.0 `LICENSE` file (#15).
- Secret scanning via gitleaks — this repository had none before (#16).
- `package.json` and a lockfile, so `npm test` and `npm ci` work.
- A registration test for `<prog-block>` (`tests/registration.test.js`) — the first test to actually
  import `src/prog-block.js`; it now guards against regressions of the fatal import bug described below.

### Changed

- A2ML retired (owner decision 2026-10-05). Contractiles are Nickel data
  (`.machine_readable/contractiles/<verb>/<verb>.ncl`, converted losslessly — byte-identical round
  trip); `tools/run-probes.sh` reads them through `nickel export` and `jq`. STATE v1's journal is
  archived at `.machine_readable/archive/state-v1.txt`; its maturity is a deed clause.
- `package.json`, `.github/labels.json` and `.github/label-classifier.json` rewritten in JCS form.

- Dependabot configuration pruned to the one ecosystem that actually exists in this repo (#15).
- README given an honesty pass (#15); rewritten again in this documentation set to replace the removed
  feature claims (preview toggle, templating wizards, live linter, WCAG AAA) with an evidence-backed
  Features table.
- CI unblocked: allowlisted the `just` installer, added JavaScript CodeQL coverage, adopted the
  workflow lockfile (#12).
- `FUNDING.yml` casing corrected — GitHub only honours the exact case (#13).
- `just test` is now able to fail — the previous recipe
  (`node --test tests/ || echo "No tests configured yet"`) swallowed a failing run and always exited
  `0`; the `||` fallback has been removed.

### Fixed

- `tools/run-probes.sh` gave each probe the previous item's severity (severity is written after
  `run`), so `--strict` miscounted critical failures. Each item's fields are now read together.
- The Bustfile's WASM probe (`file … | grep -qv WebAssembly`) passed when the file was missing.

- Single-variant code panel: `aria-label` on a role-less `<pre>` (flagged by axe) now has
  `role="group"`.

- Rendering architecture: the shadow tree is built once and patched in place instead of being rebuilt
  with `innerHTML` on every state change. Variable inputs no longer lose focus on each keystroke.
- Stylesheet path now resolves against the module URL, so `<prog-block>` is styled at any page depth.
- Falsy-value and stale-variable bugs in substitution are gone with the old interpolation code.
- `actions.lock` regenerated with `gh actions-lock` after the Dependabot bump to
  `github/codeql-action@v4.38.2` (#43) left it stale and failed `tests/ci-config.test.js`.
- `just test` ran `node --test` against `bun:test` files; it now runs `bun test`, as CI does.

- CI startup failures traced to three causes and resolved: the org's Actions allowlist missing the
  `just` installer, GitHub's workflow-lockfile enforcement, and a CodeQL default-setup/advanced-setup
  conflict rejecting every SARIF upload (#12). CI never had a green run from repo creation
  (2026-07-23) until this fix.
- The fatal import bug: `src/prog-block.js` imported `{ validateK9 }` from `src/k9-validator.js`,
  which exports only `K9Validator` and `defaultValidator`. This was a link-time `SyntaxError` — the
  module graph never finished loading, `customElements.define('prog-block', …)` never ran, and every
  `<prog-block>` on `index.html` was inert. The old test suite never caught it because nothing imported
  the component. Fixed by importing `{ defaultValidator }` instead; now guarded by
  `tests/registration.test.js`.

### Removed

- `package.k9`, a K9 manifest that nothing in the tree consumed and whose `just build` target named a
  deleted recipe (DEBT D4).
- `src/k9-validator.js`, whose `validateNickel()` returned "valid" unconditionally, and
  `contracts.ncl`, which type-checked only its own self-description; with them the `just check`
  recipe and `package.k9`'s `NICKEL validate` line (RELEASE-CRITERIA T2; DEBT C10, T4).
- Every `.a2ml` file, `src/a2ml-parser.js` (a stub nothing imported) and
  `assets/tree-sitter-a2ml.wasm` (a 118-byte text placeholder): A2ML is retired, so no A2ML
  parser is planned. `contracts.ncl` no longer declares an A2ML dialect.

- `package-lock.json`: stale beside `bun.lock`; Bun is the runtime and CI installs with
  `bun install --frozen-lockfile`.

- Out of charter (ProgBlocks is not an editor, IDE or language server): contenteditable editing,
  the placeholder linter and its button, `split-view`, smart paste (`src/modules/smart-paste.js`),
  JSON/CSV/Nickel export (`src/modules/exporter.js`, whose CSV/JSON were not structural; plain-text
  Download is kept), and the unreachable
  `src/modules/view-manager.js`. The component no longer imports `k9-validator.js`.

- Template leaks from the `squisher-corpus`/`paint-type` scaffolding sweep, including a
  security-advisory link that pointed at the wrong repository, and a `settings.yml` that would have
  silently renamed this repository to `paint-type` (#15).

### Security

- Added gitleaks-based secret scanning; this repository previously had no leak-scanning workflow at
  all (#16).
- Unescaped HTML injection fixed: author and reader text now reaches the DOM only through
  `textContent`; there is no `innerHTML` in `src/`. Covered by tests; mutation-checked once by hand on 2026-10-05 (not automated).
