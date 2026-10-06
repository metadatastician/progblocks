# SPDX-License-Identifier: MPL-2.0
# must.ncl — the must contractile of progblocks, as Nickel data.
#
# Converted losslessly from Mustfile.a2ml on 2026-10-05 (A2ML retired,
# owner decision 2026-10-05). tools/run-probes.sh exports this file with
# `nickel export` and runs each item's `run` probe. Field values are the
# original text; `text` keeps any prose that sat under a heading.
{
  verb = "must",
  header = ["# SPDX-License-Identifier: MPL-2.0", "# Mustfile — Physical-state contract for progblocks", "# Author: Jonathan D.A. Jewell (hyperpolymath)", "#", "# What MUST be true about this repository. Hard requirements. Several of", "# these ARE mechanically enforced (by ci.yml / codeql.yml / secret-scanner.yml", "# on every push); others are documentary until something automates them —", "# each entry says which.", ""],
  post_abstract = [""],
  abstract = ["Physical-state invariants for progblocks, a pre-alpha, dependency-free web", "component with no runtime dependencies. Probes target this repository's", "real tree, not a generic template."],
  sections = [
    {
      title = "File Presence",
      text = [""],
      items = [
        {
          level = 3,
          heading = "license-present",
          fields = [{ key = "description", value = "LICENSE file must exist and be the canonical MPL-2.0 text" }, { key = "run", value = "test -f LICENSE && grep -q 'Mozilla Public License Version 2.0' LICENSE" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "readme-present",
          fields = [{ key = "description", value = "README.md must exist (this repo keeps README as .md, a logged deviation — see the repo deed's (rsr-profile …) clause)" }, { key = "run", value = "test -f README.md" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "security-policy",
          fields = [{ key = "description", value = "SECURITY.md must exist" }, { key = "run", value = "test -f SECURITY.md" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "governance-docs",
          fields = [{ key = "description", value = "GOVERNANCE.md and .github/CODEOWNERS must exist" }, { key = "run", value = "test -f GOVERNANCE.md && test -f .github/CODEOWNERS" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "repo-deed",
          fields = [{ key = "description", value = "The repo deed must exist and carry the AI manifest (0-AI-MANIFEST.a2ml was folded into it on 2026-10-05, ai-manifest-decision Option A)" }, { key = "run", value = "test -f .machine_readable/descriptiles/progblocks_chora.deed && grep -q '^  (manifest' .machine_readable/descriptiles/progblocks_chora.deed" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
      ],
    },
    {
      title = "The component itself",
      text = [""],
      items = [
        {
          level = 3,
          heading = "component-source-present",
          fields = [{ key = "description", value = "The <prog-block> custom element source file must exist and define the element" }, { key = "run", value = "test -f src/prog-block.js && grep -q \"customElements.define('prog-block'\" src/prog-block.js" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary) — defining the call is necessary but not sufficient; see contractiles/bust/bust.ncl's component-fails-to-register for why the module can still fail to load" }],
          text = [""],
        },
        {
          level = 3,
          heading = "demo-page-present",
          fields = [{ key = "description", value = "index.html must exist and reference the component" }, { key = "run", value = "test -f index.html && grep -q 'prog-block' index.html" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "test-suite-present",
          fields = [{ key = "description", value = "At least one test file (bun:test) must exist under tests/" }, { key = "run", value = "test -n \"$(find tests -name '*.test.js' 2>/dev/null)\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "ci.yml `build` job (via `bun run test`)" }],
          text = [""],
        },
      ],
    },
    {
      title = "CI / lockfile",
      text = [""],
      items = [
        {
          level = 3,
          heading = "actions-lockfile-present",
          fields = [{ key = "description", value = "The gh actions-lock lockfile must exist" }, { key = "run", value = "test -f .github/workflows/actions.lock" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary) — do not \"fix\" uses: lines in the workflow files back to inline SHAs; the lockfile is the pin" }],
          text = [""],
        },
      ],
    },
    {
      title = "Directory structure",
      text = [""],
      items = [
        {
          level = 3,
          heading = "machine-readable-dir",
          fields = [{ key = "description", value = ".machine_readable/ must hold the repo deed and the six Nickel contractiles" }, { key = "run", value = "test -f .machine_readable/descriptiles/progblocks_chora.deed && test $(ls .machine_readable/contractiles/*/*.ncl | wc -l) -eq 6" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "well-known-present",
          fields = [{ key = "description", value = "The .well-known trio exists" }, { key = "run", value = "test -f .well-known/ai.txt && test -f .well-known/humans.txt && test -f .well-known/security.txt" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
      ],
    },
    {
      title = "Template integrity",
      text = [""],
      items = [
        {
          level = 3,
          heading = "machine-readable-spdx-headers",
          fields = [{ key = "description", value = "Every .deed and contractile .ncl file carries an SPDX identifier on line 1, and no .a2ml file is tracked (A2ML retired 2026-10-05)" }, { key = "run", value = "! git ls-files | grep -q '\\.a2ml$' && test $(git ls-files '*.deed' '.machine_readable/contractiles/*.ncl' | while read -r f; do head -1 \"$f\" | grep -q SPDX-License-Identifier: || echo BAD; done | wc -l) -eq 0" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary) — as of 2026-08-07 this probe currently FAILS for two pre-existing files outside this sweep's scope, .github/DISCUSSION_TEMPLATE/0.2-AI-MANIFEST.a2ml and .github/ISSUE_TEMPLATE/0.2-AI-MANIFEST.a2ml, neither of which carries an SPDX header at all; fixing those is a separate task, not silently expanded into here" }],
          text = [""],
        },
      ],
    },
    {
      title = "No verification ledger to check",
      text = ["", "This repo has no VERIFICATION.md and no src/verify*.mjs scripts, and makes", "no formal proof claims — see the repo deed's (neurosym …) clause."],
      items = [
      ],
    },
  ],
}
