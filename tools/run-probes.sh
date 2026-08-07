#!/usr/bin/env bash
# SPDX-License-Identifier: MPL-2.0
#
# run-probes.sh — execute every `- run:` probe declared in .machine_readable/contractiles/
# and report which hold against the live tree.
#
# The contractiles are documentary: they declare what MUST be true, what is trusted, what
# is intended, and what is known broken. This script is what makes them checkable rather
# than decorative. It reports; it does not gate CI. Use `--strict` to make it exit
# non-zero when any probe of severity `critical` fails.
#
# A probe line looks like:
#     - run: test -f LICENSE
#     - run: "! grep -q 'something' file"
# The value may be optionally wrapped in double quotes; that wrapper is stripped before
# evaluation, because it is A2ML quoting, not shell quoting.

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

shopt -s nullglob
for file in .machine_readable/contractiles/*/*.a2ml; do
    echo "== ${file}"
    desc=""
    severity=""
    while IFS= read -r line; do
        case "$line" in
            '- description: '*) desc="${line#- description: }" ;;
            '- severity: '*)    severity="${line#- severity: }" ;;
            '- run: '*)
                probe="${line#- run: }"
                # Strip one layer of A2ML double-quote wrapping, if present.
                if [ "${probe#\"}" != "$probe" ] && [ "${probe%\"}" != "$probe" ]; then
                    probe="${probe#\"}"
                    probe="${probe%\"}"
                fi
                if eval "$probe" >/dev/null 2>&1; then
                    printf '  PASS  %s\n' "${desc:-$probe}"
                    pass=$((pass + 1))
                else
                    printf '  FAIL  [%s] %s\n' "${severity:-unknown}" "${desc:-$probe}"
                    printf '        probe: %s\n' "$probe"
                    fail=$((fail + 1))
                    [ "$severity" = "critical" ] && critical_fail=$((critical_fail + 1))
                fi
                desc=""
                severity=""
                ;;
        esac
    done < "$file"
done

echo
echo "Probes: ${pass} pass, ${fail} fail (${critical_fail} critical)."

if [ "$STRICT" -eq 1 ] && [ "$critical_fail" -gt 0 ]; then
    echo "FAIL: ${critical_fail} critical probe(s) failing and --strict was requested."
    exit 1
fi

exit 0
