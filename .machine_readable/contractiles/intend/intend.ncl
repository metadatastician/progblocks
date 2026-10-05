# SPDX-License-Identifier: MPL-2.0
# intend.ncl — the intend contractile of progblocks, as Nickel data.
#
# Converted losslessly from Intentfile.a2ml on 2026-10-05 (A2ML retired,
# owner decision 2026-10-05). tools/run-probes.sh exports this file with
# `nickel export` and runs each item's `run` probe. Field values are the
# original text; `text` keeps any prose that sat under a heading.
{
  verb = "intend",
  header = ["# SPDX-License-Identifier: MPL-2.0", "# Intentfile — north-star contractile for progblocks", "# Author: Jonathan D.A. Jewell (hyperpolymath)", "#", "# Semantics: North-star contractile. Declares BOTH concrete committed", "#            next-actions AND horizon aspirations the project wishes to", "#            become.", "#              intents — \"we WILL do this; track progress\"", "#              wishes  — \"we WISH this were true; revisit later\"", "#            Non-gating — this is a report, not a gate. See", "#            contractiles/must/must.ncl for hard gates.", ""],
  post_abstract = [""],
  abstract = ["North-star contractile for progblocks, a dependency-free web component for", "rich code blocks in technical documentation. Currently pre-alpha: the", "component now registers reliably (a prior fatal import bug is fixed and", "guarded — see contractiles/bust/bust.ncl). On 2026-10-05 the README", "was cut to the charter (variant tabs, variables, copy, line numbers) and", "the features it advertised without having were dropped rather than kept as", "claims."],
  sections = [
    {
      title = "Purpose",
      text = ["", "Ship a small, honestly-documented, dependency-free web component that can be", "dropped into any documentation site or wiki, matching what FACTS.md", "verifies rather than what README.md aspires to.", ""],
      items = [
      ],
    },
    {
      title = "Anti-Purpose",
      text = ["", "This repository is NOT:", "- A syntax highlighter", "- A static site generator", "- A Markdown parser", "- An A2ML implementation — A2ML is retired (2026-10-05); template variables are a regex in tokenize()", "- A vehicle for claiming a feature before the code implements it", "- A code editor, IDE, linter, or language-server client (the editor, the", "  placeholder linter, split view, smart paste and structured export were removed on", "  2026-10-05 for this reason)", ""],
      items = [
      ],
    },
    {
      title = "If In Doubt",
      text = ["", "If you are unsure whether a change is in scope, ask. Sensitive areas:", "- The textContent-only rendering path that closed the former innerHTML /", "  XSS surface (see contractiles/trust/trust.ncl)", "- Licence, GOVERNANCE.md", "- .machine_readable/descriptiles/progblocks_chora.deed (repo identity)", "- progblocks-launcher.sh (generated — never hand-edit)", ""],
      items = [
      ],
    },
    {
      title = "Committed Next-Actions",
      text = [""],
      items = [
        {
          level = 3,
          heading = "fatal-import-fixed",
          fields = [{ key = "description", value = "The validateK9 named-import mismatch is fixed (customElements.define runs) and a registration test guards against it recurring" }, { key = "run", value = "\"! grep -q 'import { validateK9 }' src/prog-block.js\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "tests/registration.test.js (asserts customElements.get('prog-block') is defined), plus this probe" }, { key = "status", value = "achieved" }],
          text = [""],
        },
        {
          level = 3,
          heading = "just-test-can-fail",
          fields = [{ key = "description", value = "Justfile's test recipe reports failure honestly; the `|| echo \"No tests configured yet\"` fallback that swallowed it has been removed" }, { key = "run", value = "\"! grep -q 'No tests configured yet' Justfile\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "this probe, plus visual confirmation that `Justfile`'s `test:` recipe is a bare `bun test`" }, { key = "status", value = "achieved" }],
          text = [""],
        },
        {
          level = 3,
          heading = "package-json-present",
          fields = [{ key = "description", value = "A real package.json (ESM, dev dependencies, lockfile) exists so CI's bun install has something to install" }, { key = "run", value = "test -f package.json" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "this probe" }, { key = "status", value = "achieved" }],
          text = [""],
        },
      ],
    },
    {
      title = "Wishes",
      text = [""],
      items = [
        {
          level = 3,
          heading = "Near Horizon",
          fields = [],
          text = [""],
        },
        {
          level = 4,
          heading = "xss-remediation",
          fields = [{ key = "description", value = "Escape or otherwise neutralise the unescaped-innerHTML injection surface before this component is used on any real documentation site — done 2026-10-05 (branch feat/render-core-variants-vars): all text via textContent, tested under happy-dom" }, { key = "horizon", value = "near" }, { key = "status", value = "achieved" }],
          text = [""],
        },
        {
          level = 4,
          heading = "focus-preserving-render",
          fields = [{ key = "description", value = "Stop rewriting the whole shadow root on every keystroke so variable inputs are actually typeable — done 2026-10-05: shadow tree built once, patched in place, tested under happy-dom" }, { key = "horizon", value = "near" }, { key = "status", value = "achieved" }],
          text = [""],
        },
        {
          level = 3,
          heading = "Mid Horizon",
          fields = [],
          text = [""],
        },
        {
          level = 4,
          heading = "real-a2ml-parser (WITHDRAWN 2026-10-05 — A2ML retired)",
          fields = [{ key = "description", value = "Replace the placeholder tree-sitter-a2ml.wasm and commented-out parse path with a real, working A2ML parser so variable substitution is backed by an actual grammar instead of a bare regex" }, { key = "horizon", value = "mid" }, { key = "status", value = "withdrawn" }, { key = "notes", value = "Withdrawn 2026-10-05: A2ML is retired estate-wide, so no A2ML parser will be built; the stub and the fake .wasm were deleted. Template variables stay a regex in tokenize()." }],
          text = [""],
        },
        {
          level = 4,
          heading = "working-preview-toggle",
          fields = [{ key = "description", value = "A code/preview view toggle. README.md no longer advertises it (removed 2026-10-05); src/prog-block.js does not implement it" }, { key = "horizon", value = "mid" }, { key = "status", value = "declared" }],
          text = [""],
        },
        {
          level = 3,
          heading = "Far Horizon",
          fields = [],
          text = [""],
        },
        {
          level = 4,
          heading = "templating-wizards",
          fields = [{ key = "description", value = "Storage-backed templating wizards — currently no wizard storage, no forms, and no wizard code exists anywhere in the tree (the only storage is the opt-in `persist` variant name per group, added 2026-10-05)" }, { key = "horizon", value = "far" }, { key = "status", value = "declared" }],
          text = [""],
        },
        {
          level = 4,
          heading = "live-linter",
          fields = [{ key = "description", value = "Wire view-manager.js's WebSocket/linter code into the rendered linter panel. Withdrawn 2026-10-05: a linter is out of charter, and view-manager.js and the placeholder panel were deleted" }, { key = "horizon", value = "far" }, { key = "status", value = "withdrawn" }],
          text = [],
        },
      ],
    },
  ],
}
