# SPDX-License-Identifier: MPL-2.0
# bust.ncl — the bust contractile of progblocks, as Nickel data.
#
# Converted losslessly from Bustfile.a2ml on 2026-10-05 (A2ML retired,
# owner decision 2026-10-05). tools/run-probes.sh exports this file with
# `nickel export` and runs each item's `run` probe. Field values are the
# original text; `text` keeps any prose that sat under a heading.
{
  verb = "bust",
  header = ["# SPDX-License-Identifier: MPL-2.0", "# Bustfile — failure mode contractile for progblocks", "# Author: Jonathan D.A. Jewell (hyperpolymath)", "#", "# Every declared failure mode should have a recovery path. Status moves:", "#   declared -> drilled (probe run) -> verified (recovery confirmed)", "#   or -> failing (recovery broken)", "#", "# Most entries below are `declared`, not `verified` — these are read", "# directly from the source on 2026-08-07, not from a lived incident, except", "# where a root-cause chain in FACTS.md's \"Rehabilitation history\" already", "# confirms occurrence, or where a fix has landed and the probe now confirms", "# the regression guard holds (noted per entry).", ""],
  post_abstract = [""],
  abstract = ["Failure modes specific to progblocks: a pre-alpha, dependency-free web", "component and a launcher that cannot start the demo server. A previous", "fatal link-time load failure (component-fails-to-register, below) and the", "former XSS and focus-destroying render path (fixed 2026-10-05) are kept", "here only as regression guards. This is a shorter list than a mature repo's Bustfile because the", "project is young — but every entry here is grounded in a specific line of", "code, not a hypothetical."],
  sections = [
    {
      title = "Failure Modes",
      text = [""],
      items = [
        {
          level = 3,
          heading = "component-fails-to-register (RESOLVED)",
          fields = [{ key = "description", value = "src/prog-block.js used to import { validateK9 } from k9-validator.js, which exports only K9Validator and defaultValidator; the named-import mismatch was a link-time SyntaxError, so customElements.define('prog-block', ...) never ran and every <prog-block> on index.html was inert. Fixed by importing { defaultValidator } instead. This entry is kept as a regression guard, not a live failure mode." }, { key = "run", value = "\"! grep -q 'import { validateK9 }' src/prog-block.js\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "tests/registration.test.js (asserts customElements.get('prog-block') is defined) plus this probe" }, { key = "recovery", value = "N/A — fixed on branch fix/honest-gates-v2; since 2026-10-05 src/prog-block.js imports nothing. If this probe ever fails again, remove the import and re-run `bun test`." }, { key = "expected_recovery_time_seconds", value = "60" }, { key = "status", value = "verified" }],
          text = [""],
        },
        {
          level = 3,
          heading = "launcher-cannot-start-server",
          fields = [{ key = "description", value = "progblocks-launcher.sh cannot start the demo server — REPO_DIR is never populated (so cd \"$REPO_DIR\" silently no-ops) and the startup-command search requires [ -x \"$candidate\" ], which is false for a string like \"python3 -m http.server\", so START_COMMAND is always empty" }, { key = "run", value = "grep -q 'REPO_DIR=\"\"' progblocks-launcher.sh" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary) — see the repo deed's (agentic …) and (playbook …) clauses" }, { key = "recovery", value = "Run the demo manually — python3 -m http.server 8080, then open index.html. File the {repo-dir}-token-loss bug upstream in launch-scaffolder; do not hand-edit the generated .sh." }, { key = "expected_recovery_time_seconds", value = "30" }, { key = "status", value = "resolved" }, { key = "notes", value = "The placeholder and src/a2ml-parser.js were deleted on 2026-10-05: A2ML is retired, so no A2ML parser is planned. The probe now guards that the fake asset stays gone. (The old probe, file … | grep -qv WebAssembly, also passed on a missing file.)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "xss-injection-surface (RESOLVED 2026-10-05)",
          fields = [{ key = "description", value = "Variant content used to be read via innerHTML and re-injected as HTML with no escaping, and variable values interpolated unescaped into value=\"${val}\". Fixed on branch feat/render-core-variants-vars: the shadow tree is built with DOM APIs and all author/reader text goes in via textContent. Kept as a regression guard" }, { key = "run", value = "\"! grep -rn '\\.innerHTML' src/\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "tests/component.test.js (\"untrusted content is never rendered as markup\", four tests, happy-dom) plus this probe" }, { key = "recovery", value = "N/A — fixed. If this probe ever fails, move the new code back to textContent plus DOM API construction" }, { key = "expected_recovery_time_seconds", value = "3600" }, { key = "status", value = "verified" }],
          text = [""],
        },
        {
          level = 3,
          heading = "editing-destroys-focus-and-templates (RESOLVED 2026-10-05)",
          fields = [{ key = "description", value = "Editing a variable input used to trigger a full shadowRoot.innerHTML rewrite, destroying the <input> being typed into; separately, the contenteditable editor overwrote variant source with post-interpolation text. Fixed: the shadow tree is built once and patched in place (rebuilt only when the authored light DOM changes, never on typing), and the editor was removed as out of charter. Kept as a regression guard" }, { key = "run", value = "\"! grep -q 'shadowRoot.innerHTML' src/prog-block.js\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "tests/component.test.js (\"typing keeps the same input element…\") plus this probe" }, { key = "recovery", value = "N/A — fixed. If this probe ever fails, patch only the changed nodes instead of rebuilding the shadow root" }, { key = "expected_recovery_time_seconds", value = "3600" }, { key = "status", value = "verified" }],
          text = [""],
        },
        {
          level = 3,
          heading = "wasm-placeholder-not-webassembly (RESOLVED 2026-10-05 — deleted with the A2ML retirement)",
          fields = [{ key = "description", value = "assets/tree-sitter-a2ml.wasm is a 118-byte ASCII placeholder, not real WebAssembly; the tree-sitter path in a2ml-parser.js is commented out and nothing imports the module" }, { key = "run", value = "test ! -e assets/tree-sitter-a2ml.wasm" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }, { key = "recovery", value = "Either vendor a real compiled tree-sitter-a2ml.wasm and un-comment the parse path, or remove the file and stop implying a parser exists" }, { key = "expected_recovery_time_seconds", value = "7200" }, { key = "status", value = "declared" }],
          text = [""],
        },
        {
          level = 3,
          heading = "ci-red-since-repo-creation",
          fields = [{ key = "description", value = "CI never had a green run from repo creation (2026-07-23) until PR #12 — root causes were the just installer not being on the org's Actions allowlist, missing JS CodeQL coverage, and later a CodeQL default-vs-advanced conflict and workflow-lockfile enforcement" }, { key = "run", value = "git log --oneline | grep -q 'fix(ci): unblock Actions'" }, { key = "severity", value = "info" }, { key = "enforced-by", value = "not yet automated (documentary)" }, { key = "recovery", value = "Already recovered — see FACTS.md Rehabilitation history table (PR #12, #13, #15, #16). Kept here because startup_failure has flapped on and off since from GitHub-side cohort enforcement, which is external, not a repo defect." }, { key = "expected_recovery_time_seconds", value = "0" }, { key = "status", value = "verified" }],
          text = [],
        },
      ],
    },
  ],
}
