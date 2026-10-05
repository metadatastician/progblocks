# SPDX-License-Identifier: MPL-2.0
# adjust.ncl — the adjust contractile of progblocks, as Nickel data.
#
# Converted losslessly from Adjustfile.a2ml on 2026-10-05 (A2ML retired,
# owner decision 2026-10-05). tools/run-probes.sh exports this file with
# `nickel export` and runs each item's `run` probe. Field values are the
# original text; `text` keeps any prose that sat under a heading.
{
  verb = "adjust",
  header = ["# SPDX-License-Identifier: MPL-2.0", "# Adjustfile — Accessibility drift-tolerance contract for progblocks", "# Author: Jonathan D.A. Jewell (hyperpolymath)", "#", "# Cumulative-drift catchment for accessibility specifically: tolerance", "# bands + corrective actions. Authority: advisory — continue-with-warnings,", "# not a hard gate.", ""],
  post_abstract = [""],
  abstract = ["Accessibility is this repo's stated target (README.md: accessibility", "\"Implemented, not verified\", AA target) and its most concrete drift risk: it is easy", "to let a claim of AAA, or of AA fully met, creep into documentation that", "the markup does not back up. AAA IS NOT MET. AA is the target, and AA is", "not verified either. The structural gaps below were read from the source on", "2026-08-07 and fixed in the render-core rewrite on 2026-10-05; what remains", "is verification — no screen reader yet, and the axe-core audit", "(just a11y, 0 violations on 2026-10-05) also runs in CI (see verification-missing below)."],
  sections = [
    {
      title = "Level Honesty",
      text = [""],
      items = [
        {
          level = 3,
          heading = "wcag-level-honesty",
          fields = [{ key = "description", value = "README states a WCAG 2.1 AA target; nothing in this repo may ASSERT AAA conformance. The pattern matches claim-shaped phrases only, so honest disclaimers (\"not the previously-claimed AAA\") do not trip it." }, { key = "run", value = "\"! grep -qiE '(conform|complian|meets|achiev|certif|level)[a-z]* +(to +|with +)?(wcag +)?2?\\.?1? *AAA|WCAG *2?\\.?1? *AAA +(conforman|complian)' README.md\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
        {
          level = 3,
          heading = "present-aria-semantics",
          fields = [{ key = "description", value = "The baseline ARIA that IS present must not regress — role=tablist/tab and aria-selected are the floor (since 2026-10-05 the roles are set via setAttribute-style attribute objects, e.g. role: 'tablist', so the probe matches that form)" }, { key = "run", value = "grep -q \"role: 'tablist'\" src/prog-block.js && grep -q \"role: 'tab'\" src/prog-block.js && grep -q 'aria-selected' src/prog-block.js" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "not yet automated (documentary)" }],
          text = [""],
        },
      ],
    },
    {
      title = "Known AA Gaps (tracked, not gated — do not let these silently become \"compliant\" claims)",
      text = [""],
      items = [
        {
          level = 3,
          heading = "roving-tabindex-missing (RESOLVED 2026-10-05)",
          fields = [{ key = "description", value = "The tablist had no roving tabindex / arrow-key navigation. Fixed: roving tabindex, ArrowLeft/ArrowRight with wrap, Home/End, automatic activation — asserted in tests/component.test.js under happy-dom" }, { key = "tolerance", value = "still 0 tolerance for a documentation claim of an \"APG-compliant\" or AA-conformant tablist until verification-missing below is closed" }, { key = "corrective", value = "done (src/prog-block.js _onTabKey / _renderVariant)" }, { key = "severity", value = "advisory" }],
          text = [""],
        },
        {
          level = 3,
          heading = "tabpanel-pairing-missing (RESOLVED 2026-10-05)",
          fields = [{ key = "description", value = "There was no tabpanel role + aria-controls/aria-labelledby pairing. Fixed: the code panel is role=\"tabpanel\", each tab's aria-controls points at it, and its aria-labelledby follows the selected tab — asserted in tests/component.test.js" }, { key = "tolerance", value = "n/a" }, { key = "corrective", value = "done" }, { key = "severity", value = "advisory" }],
          text = [""],
        },
        {
          level = 3,
          heading = "aria-live-missing (PARTLY RESOLVED 2026-10-05)",
          fields = [{ key = "description", value = "There was no live region. Now a role=\"status\" region announces the copy and download results. A variant switch the reader makes is conveyed by focus moving to the newly selected tab; a switch caused by group sync from ANOTHER block is not announced" }, { key = "tolerance", value = "known gap for group-synced changes, tracked here" }, { key = "corrective", value = "decide whether group-synced switches need an announcement, and if so route them through the status region" }, { key = "severity", value = "advisory" }],
          text = [""],
        },
        {
          level = 3,
          heading = "inactive-tab-contrast (RESOLVED 2026-10-05)",
          fields = [{ key = "description", value = "Inactive tabs used to render at opacity: 0.7, degrading text contrast. Removed; selection is shown by an underline bar plus font weight. Kept as a regression guard. The default palette's contrast has still not been measured" }, { key = "run", value = "\"! grep -q 'opacity: 0.7' src/prog-block.css\"" }, { key = "severity", value = "warning" }, { key = "enforced-by", value = "this probe" }],
          text = [""],
        },
        {
          level = 3,
          heading = "focus-destroyed-on-keystroke (RESOLVED 2026-10-05)",
          fields = [{ key = "description", value = "Editing a variable input used to trigger a full shadowRoot.innerHTML rewrite, destroying the focused <input>. Fixed: the shadow tree is built once and patched in place (since 2026-10-05 it is rebuilt only when the authored light DOM changes, never on typing). Kept as a regression guard" }, { key = "run", value = "\"! grep -q 'shadowRoot.innerHTML' src/prog-block.js\"" }, { key = "severity", value = "critical" }, { key = "enforced-by", value = "tests/component.test.js (\"typing keeps the same input element…\") plus this probe — same defect tracked in ../bust/bust.ncl" }],
          text = [""],
        },
        {
          level = 3,
          heading = "verification-missing",
          fields = [{ key = "description", value = "Accessibility is verified by structural unit tests and a local axe-core audit (just a11y: 0 violations, resting-state contrast on 39 nodes, 2026-10-05) that also runs in CI's build job — but there is no screen-reader session" }, { key = "tolerance", value = "known gap, tracked here; 0 tolerance for any claim that AA is met while this is open" }, { key = "corrective", value = "test with at least one real screen reader" }, { key = "severity", value = "advisory" }],
          text = [""],
        },
      ],
    },
    {
      title = "Drift Tolerance",
      text = [""],
      items = [
        {
          level = 3,
          heading = "aaa-claim-creep",
          fields = [{ key = "description", value = "No documentation file anywhere in this repo should claim AAA conformance" }, { key = "tolerance", value = "0 occurrences of \"AAA\" in README.md or .machine_readable/** (including the repo deed)" }, { key = "corrective", value = "grep -ril 'AAA' README.md .machine_readable/ and remove" }, { key = "severity", value = "advisory" }],
          text = [],
        },
      ],
    },
  ],
}
