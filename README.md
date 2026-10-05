# ProgBlocks

**A dependency-free web component for variant-aware, personalisable code examples in technical documentation — pre-alpha.**

## What this is

ProgBlocks is a single custom element, `<prog-block>`, that renders variant-switchable,
variable-substituted code examples for documentation: pick an OS/shell/language tab, fill in
`{{ variables }}`, copy the result.
Conceived for [BerryWiki](https://github.com/metadatastician/berrywiki) and decoupled by design so it
can be injected into `ddraig-ssg` output, `nextgen-languages` previewers, or plain Markdown sites. What
follows is what actually exists, not the pitch — for the itemised, evidence-backed version see
[`AUDIT.adoc`](./AUDIT.adoc) (verified vs. asserted vs. explicitly-not-claimed) and
[`DEBT.adoc`](./DEBT.adoc) (known defects, with status).

## Status

**Pre-alpha. Nothing has been released.** Version numbers disagree with each other and none of them mean
anything yet: `package.k9` and `contracts.ncl` say `1.0.0`; `progblocks.launcher.a2ml` and
`progblocks-launcher.sh` say `0.1.0`; `package.json` says `0.3.0`. Treat all three as noise.

**The core works and is tested.** As of 2026-10-05 the component builds its shadow tree once and patches
it in place; every piece of author or reader text reaches the page through `textContent`, never
`innerHTML`. That one change closed the injection surface, made variables typeable, and made the
tablist accessible. `bun test` runs 37 tests, 0 failing, and `just a11y` (axe-core in a real Chromium) reports no
WCAG 2.2 AA violations on the demo. Nothing has been checked with a screen reader yet.

**Scope was cut to the charter.** ProgBlocks renders code examples; it is not an editor, IDE or language
server. The contenteditable editor, the placeholder linter, split view, smart paste and the
JSON/CSV/Nickel export (whose encodings were not real) have been removed; export is now a plain-text
Download of the personalised example.

## Try it

Open `index.html` in a browser, or embed it anywhere:

```html
<script type="module" src="/path/to/progblocks/src/prog-block.js"></script>

<prog-block group="os" line-numbers>
  <template data-variant="macOS">brew install {{ package = ripgrep }}</template>
  <template data-variant="Linux">sudo apt-get install {{ package = ripgrep }}</template>
</prog-block>
```

Write example code inside `<template>` the way you would inside `<pre>`: escape `<` as `&lt;` and
`&` as `&amp;`. Unescaped tags are dropped, never rendered. The stylesheet is resolved against the
module's own URL, so the page can live at any depth.

## Authoring reference

| You write | You get |
|---|---|
| `<template data-variant="Name">…</template>` (two or more) | A tab per variant, WAI-ARIA tabs keyboard model (arrows, Home, End) |
| Plain text, no templates | A single example; the `language` attribute is shown as its label |
| `{{ name }}` | A labelled input; the value is substituted everywhere it appears, in every variant |
| `{{ name = default }}` | The same, pre-filled with `default` until the reader types |
| `group="os"` | Every block in the page with that group switches variant together |
| `variant="Linux"` | The initially selected variant |
| `persist` (with `group`) | The reader's tab choice is remembered in `localStorage` (key `progblocks:variant:<group>`) and restored on the next page load, ahead of `variant`. Only the variant name is stored; if storage is blocked, the group still syncs within the page |
| `label="Operating system"` | Accessible name of the tablist (default "Example variants") |
| `line-numbers` | A line-number gutter, hidden from assistive technology and from copy |
| `language="bash"` | `class="language-bash"` on the `<code>`, for an external highlighter |
| `filename="install.sh"` | The Download button's file name (default `example.txt`) |
| `glyph-mode` | A compact inline rendering with no header or inputs |

**Script API:** `block.variant` (get/set), `block.text` (the personalised example),
`block.getVariable(name)`, `block.setVariable(name, value)`, `block.refresh()` (re-reads authored content; only needed
after editing a `<template>`'s `.content` directly, which no observer can see). Other light-DOM edits are picked up
automatically.
**Events** (bubbling, composed): `progblocks:variant-change` `{ variant }`,
`progblocks:variable-change` `{ name, value }`.
**Styling:** `--pb-*` custom properties, and `::part(header | tab | copy-button | download-button | variables | code | variable)`.

## Features

| Feature | Status | Notes |
|---|---|---|
| Custom element registers | Works | Guarded by `tests/registration.test.js` |
| Safe rendering of untrusted content | Works | No `innerHTML` in `src/`; tested for markup in variants, tab labels and typed values, mutation-checked once by hand on 2026-10-05 (not automated) |
| Variant tabs | Works | Tabs pattern with roving `tabindex`, `aria-controls`/`aria-labelledby`, wrap-around arrows, Home/End |
| Cross-block variant sync | Works | `group` attribute; page-local by default. With `persist` the reader's choice is remembered across page loads in `localStorage`; no cross-tab sync |
| Variable substitution | Works | Inline defaults; one input per variable across all variants; values survive variant switches; typing keeps focus |
| Copy to clipboard | Works | Copies the personalised text; result announced via a `role=status` live region |
| Download | Works | Saves the personalised text as plain text; `filename` attribute, default `example.txt` |
| Line numbers | Works | `line-numbers` attribute |
| Accessibility | Audited, not screen-reader tested | AA target. Labelled inputs, focus rings, forced-colours support, no colour-only state. axe-core: 0 violations (`just a11y`) |
| Syntax highlighting | **Absent** | Out of scope for now; the `language-*` class lets a host highlighter hook in |
| Reacting to light-DOM changes after connect | Works | A `MutationObserver` rebuilds the block (one rebuild per microtask), keeping the selected variant and the reader's values; focus inside the block is lost when it rebuilds. Edits to a `<template>`'s `.content` need `block.refresh()` |
| A2ML parser (tree-sitter/WASM) | **Absent** | `src/a2ml-parser.js` is a stub and is no longer imported; `assets/tree-sitter-a2ml.wasm` is a placeholder |
| K9 / Nickel validation triad | **Absent** | `src/k9-validator.js` is no longer imported by the component |

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
just test    # bun test — the same command CI runs (`bun run test`)
just check   # nickel export contracts.ncl — requires Nickel on PATH
just a11y    # axe-core audit of index.html in Chromium — set CHROMIUM_PATH
```

`tests/component.test.js` covers rendering safety, variants, variables, copy, embedding, the `persist` option and
authored content that changes after render;
`tests/registration.test.js` guards module loading; `tests/ci-config.test.js` and
`tests/dependabot-config.test.js` guard the CI configuration.

## Licence

[MPL-2.0](./LICENSE). Historic conflicting licence claims — AGPL in a stray `settings.yml`, CC-BY-SA in
the launcher A2ML — were resolved to MPL-2.0 in PR #15. SPDX headers estate-wide are MPL-2.0.

## Origin

Conceived for [BerryWiki](https://github.com/metadatastician/berrywiki); decoupled by design so it can
be injected into `ddraig-ssg` output, `nextgen-languages` previewers, or plain Markdown sites. Part of
the Hyperpolymath / Metadatastician ecosystem.
