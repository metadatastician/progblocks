# SPDX-License-Identifier: MPL-2.0
# trust.ncl — the trust contractile of progblocks, as Nickel data.
#
# Converted losslessly from Trustfile.a2ml on 2026-10-05 (A2ML retired,
# owner decision 2026-10-05). tools/run-probes.sh exports this file with
# `nickel export` and runs each item's `run` probe. Field values are the
# original text; `text` keeps any prose that sat under a heading.
{
  verb = "trust",
  header = ["# SPDX-License-Identifier: MPL-2.0", "# Trustfile — Trust boundaries and integrity invariants for progblocks", "# Author: Jonathan D.A. Jewell (hyperpolymath)", "#", "# What LLM/SLM agents are trusted to do without asking, and integrity", "# invariants that verify the repo has not been tampered with.", ""],
  post_abstract = [""],
  abstract = ["Trust boundaries and integrity checks for progblocks. A small, dependency-", "free browser component with no server component and no runtime", "dependencies — but its whole job is rendering untrusted documentation", "content. Until 2026-10-05 it had a real, unescaped-innerHTML injection", "surface; that was closed by rendering all author and reader text through", "textContent (see the repo deed's (neurosym …) clause,", "../contractiles/bust/bust.ncl). The trust model below keeps it closed."],
  sections = [
    {
      title = "Trust Level",
      text = ["", "Current trust level: standard", "", "- Agent may read and edit the component source, tests, and machine-readable", "  metadata freely.", "- Agent must NOT widen trust of variant content or variable values (for", "  example rendering them as markup, or adding a sanitiser allowlist)", "  without flagging it — rendering and sanitisation choices here are", "  security-sensitive and reviewed, not silently patched in.", "- Never re-inline action SHAs that .github/workflows/actions.lock owns.", "- Never hand-edit progblocks-launcher.sh — it is generated.", "- Licence, org, and CLADE identity fields are maintainer-only.", ""],
      items = [
      ],
    },
    {
      title = "Integrity Invariants",
      text = [""],
      items = [
        {
          level = 3,
          heading = "no-secrets-committed",
          fields = [{ key = "description", value = "No credential files in repo" }, { key = "run", value = "test ! -f .env && test ! -f credentials.json" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = ".github/workflows/secret-scanner.yml (gitleaks)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "no-private-keys",
          fields = [{ key = "description", value = "No private key files committed" }, { key = "run", value = "\"! find . -not -path './node_modules/*' -not -path './.git/*' \\( -name '*.pem' -o -name '*.key' -o -name 'id_rsa' -o -name 'id_ed25519' \\) 2>/dev/null | head -1 | grep -q .\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = ".github/workflows/secret-scanner.yml (gitleaks)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "no-tokens-in-source",
          fields = [{ key = "description", value = "No hardcoded API tokens in the component source" }, { key = "run", value = "\"! grep -rniE '(api[_-]?key|secret|token|password)[[:space:]]*[:=][[:space:]]*.?[A-Za-z0-9]{16,}' src/ 2>/dev/null | grep -q .\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = ".github/workflows/secret-scanner.yml (gitleaks)" }],
          text = [""],
        },
      ],
    },
    {
      title = "Provenance",
      text = [""],
      items = [
        {
          level = 3,
          heading = "author-correct",
          fields = [{ key = "description", value = "Git author matches expected identity" }, { key = "run", value = "\"git log -1 --format='%ae' | grep -qE '(hyperpolymath|j\\\\.d\\\\.a\\\\.jewell)'\"" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "license-content",
          fields = [{ key = "description", value = "LICENSE is the canonical MPL-2.0 text" }, { key = "run", value = "grep -q 'Mozilla Public License Version 2.0' LICENSE" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
      ],
    },
    {
      title = "Sensitive areas requiring explicit approval",
      text = ["", "- GOVERNANCE.md", "- .github/CODEOWNERS", "- LICENSE", "- .github/workflows/actions.lock (the pin — do not re-inline SHAs)", "- progblocks-launcher.sh (generated — never hand-edit; fix progblocks.launcher_praxis.deed or the upstream launch-scaffolder instead)", "- .machine_readable/descriptiles/progblocks_chora.deed (repo identity — never copy another repo's UUID/name)", "- src/prog-block.js's rendering path (el(), _readLightDom(), _renderVariant(), _renderValues()) — must stay textContent-only; it replaced the former innerHTML XSS surface"],
      items = [
      ],
    },
  ],
}
