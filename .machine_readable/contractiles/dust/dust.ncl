# SPDX-License-Identifier: MPL-2.0
# dust.ncl — the dust contractile of progblocks, as Nickel data.
#
# Converted losslessly from Dustfile.a2ml on 2026-10-05 (A2ML retired,
# owner decision 2026-10-05). tools/run-probes.sh exports this file with
# `nickel export` and runs each item's `run` probe. Field values are the
# original text; `text` keeps any prose that sat under a heading.
{
  verb = "dust",
  header = ["# SPDX-License-Identifier: MPL-2.0", "# Dustfile — Cleanup and hygiene contract for progblocks", "# Author: Jonathan D.A. Jewell (hyperpolymath)", "#", "# What should be cleaned up (exnovated) or clearly re-labelled. Housekeeping,", "# not blockers — see ../bust/bust.ncl for what's actually broken.", ""],
  post_abstract = [""],
  abstract = ["Cleanup and hygiene items for progblocks. view-manager.js, the largest", "dead-code item, was deleted on 2026-10-05 (with exporter.js and", "smart-paste.js). The unimported stubs a2ml-parser.js and", "k9-validator.js and the tree-sitter-a2ml.wasm placeholder (not real", "WebAssembly) were deleted on 2026-10-05 and 2026-10-06. They had misled a", "reader of the source tree into thinking more was wired up than actually was;", "their entries below are kept as regression guards."],
  sections = [
    {
      title = "Dead Code",
      text = [""],
      items = [
        {
          level = 3,
          heading = "view-manager-unreferenced (RESOLVED 2026-10-05 — deleted)",
          fields = [{ key = "description", value = "src/modules/view-manager.js (55 lines) was never imported by anything, yet held the only real linter/WebSocket code while the component rendered a hardcoded '<i>Linter ready</i>' string. Both were deleted on 2026-10-05; a linter is out of charter" }, { key = "run", value = "test ! -e src/modules/view-manager.js" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "this probe" }, { key = "notes", value = "The delete path was taken. If a linter is ever wanted, it returns as a real change with tests, not as an unimported module." }],
          text = [""],
        },
        {
          level = 3,
          heading = "a2ml-parser-stub (RESOLVED 2026-10-05 — deleted; A2ML retired)",
          fields = [{ key = "description", value = "src/a2ml-parser.js (60 lines) has its tree-sitter path commented out; the A2MLState class is dead code; nothing imports the module (the component uses its own tokenize())" }, { key = "run", value = "test ! -e src/a2ml-parser.js" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "wasm-placeholder (RESOLVED 2026-10-05 — deleted; A2ML retired)",
          fields = [{ key = "description", value = "assets/tree-sitter-a2ml.wasm is a 118-byte ASCII text placeholder (\"// Dummy WASM file placeholder\"), not real WebAssembly" }, { key = "run", value = "test ! -e assets/tree-sitter-a2ml.wasm" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }, { key = "notes", value = "Either vendor a real compiled artefact or remove the file — a fake .wasm sitting in assets/ implies a working parser that does not exist." }],
          text = [""],
        },
        {
          level = 3,
          heading = "fake-validator-methods (RESOLVED 2026-10-06 — src/k9-validator.js deleted; RELEASE-CRITERIA T2)",
          fields = [{ key = "description", value = "k9-validator.js's validateNickel() fakes a 50ms setTimeout then unconditionally returns {valid:true, errors:[]}; executeJustTask() console.logs and returns true. Neither is called by anything, and since 2026-10-05 nothing imports the module." }, { key = "run", value = "test ! -e src/k9-validator.js" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
      ],
    },
    {
      title = "Version Drift",
      text = [""],
      items = [
        {
          level = 3,
          heading = "version-string-disagreement (RESOLVED 2026-10-05 — all fields aligned on 0.3.0)",
          fields = [{ key = "description", value = "package.k9 and contracts.ncl (deleted 2026-10-06) said 1.0.0; progblocks.launcher.a2ml (now progblocks.launcher_praxis.deed) and progblocks-launcher.sh said 0.1.0; package.json said 0.3.0. The run line now detects a regression: it matches only if a field has drifted off 0.3.0 again" }, { key = "run", value = "! grep -qE '\"(1\\.0\\.0|0\\.1\\.0)\"' package.k9 progblocks-launcher.sh && grep -q ':version \"0.3.0\"' progblocks.launcher_praxis.deed" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }, { key = "notes", value = "Resolve to one version before any tag is cut — see the repo deed's (playbook (release-process …)) clause." }],
          text = [""],
        },
      ],
    },
    {
      title = "Build Recipe Honesty",
      text = [""],
      items = [
        {
          level = 3,
          heading = "fake-build-recipe (RESOLVED — recipe removed)",
          fields = [{ key = "description", value = "Justfile's build recipe used to cat-concatenate ES modules into one file without stripping import/export syntax, producing a file that could not run as a script. Rather than fix it, the recipe was deleted; there is no `build:` recipe in the Justfile at all now." }, { key = "run", value = "\"! grep -q '^build:' Justfile\"" }, { key = "severity", value = "info" }, { key = "enforced-by", value = "this probe" }, { key = "notes", value = "If a real bundle step is ever needed, use a real bundler (esbuild) — do not re-add a recipe that only implies one exists." }],
          text = [],
        },
      ],
    },
  ],
}
