#!/usr/bin/env bash
# SPDX-License-Identifier: MPL-2.0
#
# run-probes.sh — execute every `run` probe declared in .machine_readable/contractiles/
# and report which hold against the live tree.
#
# The contractiles are documentary: they declare what MUST be true, what is trusted, what
# is intended, and what is known broken. This script is what makes them checkable rather
# than decorative. It reports; it does not gate CI. Use `--strict` to make it exit
# non-zero when any probe of severity `critical` fails.
#
# Each contractile is Nickel data, .machine_readable/contractiles/<verb>/<verb>.ncl (A2ML was
# retired on 2026-10-05). An item's fields are ordered { key, value } pairs; a probe is the
# value of a `run` field, a shell one-liner, for example:
#     test -f LICENSE
#     "! grep -q 'something' file"
# A value wrapped in double quotes has that wrapper stripped before evaluation: it is
# quoting carried over from the old A2ML text, not shell quoting.
#
# Requires `nickel` and `jq` on PATH (both are estate tools; see tools/env.sh).

# NOTE: deliberately no `pipefail`. Probes are arbitrary shell one-liners, and many end in
# `| grep -q …`, which exits as soon as it matches and SIGPIPEs the command upstream of it.
# Under pipefail that upstream death becomes the pipeline's exit status, so a probe that
# succeeded is reported as failed. A reporting tool that invents failures is as dishonest as
# a gate that cannot fail.
set -u

cd "$(dirname "$0")/.." || exit 2

STRICT=0
[ "${1:-}" = "--strict" ] && STRICT=1

pass=0
fail=0
critical_fail=0

for tool in nickel jq; do
    command -v "$tool" >/dev/null 2>&1 || { echo "run-probes: '$tool' is required but not on PATH" >&2; exit 2; }
done

# probes_of FILE — prints, NUL-separated, a (description, severity, probe) triple
# for every item of a Nickel contractile that declares a `run` field. All of an
# item's fields are gathered before anything is printed, so a `severity` written
# after `run` is still attributed to its own probe.
probes_of() {
    nickel export --format json "$1" \
        | jq -j '.sections[].items[]
                 | (reduce .fields[] as $f ({}; .[$f.key] = $f.value)) as $item
                 | select($item.run)
                 | "\($item.description // "")\u0000\($item.severity // "unknown")\u0000\($item.run)\u0000"'
}

shopt -s nullglob
for file in .machine_readable/contractiles/*/*.ncl; do
    echo "== ${file}"
    # Export first and check the status on its own: inside a pipeline the exit
    # status would be base64's, and an unparseable contractile would silently
    # drop its probes instead of failing.
    if ! nickel export --format json "$file" >/dev/null 2>&1; then
        printf '  FAIL  [critical] %s does not parse as Nickel; its probes were not run\n' "$file"
        fail=$((fail + 1))
        critical_fail=$((critical_fail + 1))
        continue
    fi
    triples=$(probes_of "$file" | base64 -w0)
    while IFS= read -r -d '' desc && IFS= read -r -d '' severity && IFS= read -r -d '' probe; do
        # Strip one layer of double-quote wrapping, if present.
        if [ "${probe#\"}" != "$probe" ] && [ "${probe%\"}" != "$probe" ]; then
            probe="${probe#\"}"
            probe="${probe%\"}"
        fi
        if eval "$probe" >/dev/null 2>&1; then
            printf '  PASS  %s\n' "${desc:-$probe}"
            pass=$((pass + 1))
        else
            printf '  FAIL  [%s] %s\n' "$severity" "${desc:-$probe}"
            printf '        probe: %s\n' "$probe"
            fail=$((fail + 1))
            [ "$severity" = "critical" ] && critical_fail=$((critical_fail + 1))
        fi
    done < <(printf '%s' "$triples" | base64 -d)
done

echo
echo "Probes: ${pass} pass, ${fail} fail (${critical_fail} critical)."

if [ "$STRICT" -eq 1 ] && [ "$critical_fail" -gt 0 ]; then
    echo "FAIL: ${critical_fail} critical probe(s) failing and --strict was requested."
    exit 1
fi

exit 0
