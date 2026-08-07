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

- Template leaks from the `squisher-corpus`/`paint-type` scaffolding sweep, including a
  security-advisory link that pointed at the wrong repository, and a `settings.yml` that would have
  silently renamed this repository to `paint-type` (#15).

### Security

- Added gitleaks-based secret scanning; this repository previously had no leak-scanning workflow at
  all (#16).
- *(Documented, not yet fixed)* Unescaped HTML injection: variant content and variable values are
  interpolated as raw HTML with no escaping anywhere in `src/`. Tracked in `DEBT.adoc`, scheduled for a
  `fix/render-security` pass, not yet started.
