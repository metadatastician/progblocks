# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Nothing has been released. There is no tagged version and no published package; everything below is
`[Unreleased]`. Version strings that appear elsewhere in this repo (`package.k9`/`contracts.ncl` say
`1.0.0`; the launcher config says `0.1.0`; `package.json` says `0.3.0`) are drift, not history — do not
read them as prior releases.

## [Unreleased]

### Added

- Variant switching completed: WAI-ARIA tabs keyboard model (arrows with wrap, Home, End), roving
  `tabindex`, `tabpanel` with `aria-controls`/`aria-labelledby`; `variant`, `group` and `label`
  attributes; `group` keeps every block on a page showing the same variant.
- Variable defaults with `{{ name = default }}`; one labelled input per variable shared across variants.
- Copy and Download (plain text, `filename` attribute) buttons, with the outcome announced through a `role=status` live region.
- Embedding API: `variant`, `text`, `getVariable()`, `setVariable()`, the `progblocks:variant-change`
  and `progblocks:variable-change` events, and `::part()` names.
- `just a11y` (`tools/a11y-audit.mjs`): axe-core audit of the demo in a real Chromium, exiting 1 on
  any violation. Dev dependencies `axe-core` and `playwright-core` (no bundled browser).
- `tests/component.test.js` (22 behavioural tests) and `tests/helpers/dom.js`.

- `.gitignore` and the MPL-2.0 `LICENSE` file (#15).
- Secret scanning via gitleaks — this repository had none before (#16).
- `package.json` and a lockfile, so `npm test` and `npm ci` work.
- A registration test for `<prog-block>` (`tests/registration.test.js`) — the first test to actually
  import `src/prog-block.js`; it now guards against regressions of the fatal import bug described below.

### Changed

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
