# Repository instructions

ProgBlocks is a single custom element (`<prog-block>`) meant to render variant-switchable,
variable-substituted code blocks. It is pre-alpha and unreleased. A fatal import bug in
`src/prog-block.js` used to keep it from registering as a custom element at all; that has been fixed
and is guarded by `tests/registration.test.js`. Read `0-AI-MANIFEST.a2ml`, then
`.machine_readable/descriptiles/STATE.a2ml`, then `README.md`,
then `DEBT.adoc` before touching anything. `README.md`'s Features table and `ARCHITECTURE.md`'s
"intended vs. actual" section are the fastest way to learn which claims in `contracts.ncl` and
`package.k9` are aspirational rather than true.

Do not hand-edit the generated `progblocks-launcher.sh` — it is produced from
`progblocks.launcher.a2ml` by `launch-scaffolder` and marked "do not edit" in its own header; its
current breakage is an upstream generator bug, fix it there, not here. Do not re-inline action SHAs
that `.github/workflows/actions.lock` already owns — the `uses:` tag refs plus the lockfile are the
sanctioned pinning form for this repo, not literal SHAs in the YAML. Every `.a2ml` file needs its SPDX
identifier on line 1, not merely present somewhere in the file. Never document a feature the code does
not implement — if you're unsure whether something works, read the source and check
`EXPLAINME.adoc`'s claim-to-evidence table before writing a claim, or add a row to it if you found
something new.

Before finishing any change, run `npm test` or `just test` — both now propagate a real failure (the old
`|| echo "No tests configured yet"` fallback that swallowed failures has been removed). If you changed
anything under `docs/wiki/`, also run `./tools/check-wiki-health.sh`.
