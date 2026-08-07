#!/usr/bin/env bash
# SPDX-License-Identifier: MPL-2.0
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
register="${repo_root}/programme/wiki-page-register.toml"
required=(
  page-id page-title page-audience page-maturity page-owner
  page-last-reviewed page-next-review
)
errors=0
pages=0
ids_file="$(mktemp)"
trap 'rm -f "${ids_file}"' EXIT

if [[ ! -f "${register}" ]]; then
  printf 'ERROR machine register missing: %s\n' "${register}" >&2
  exit 1
fi

while IFS= read -r relative; do
  file="${repo_root}/${relative}"
  pages=$((pages + 1))
  if [[ ! -f "${file}" ]]; then
    printf 'ERROR registered page missing: %s\n' "${relative}" >&2
    errors=$((errors + 1))
    continue
  fi
  for attribute in "${required[@]}"; do
    if ! grep -q "^:${attribute}:" "${file}"; then
      printf 'ERROR %s lacks :%s:\n' "${relative}" "${attribute}" >&2
      errors=$((errors + 1))
    fi
  done
  page_id="$(sed -n 's/^:page-id:[[:space:]]*//p' "${file}" | head -n 1)"
  printf '%s\t%s\n' "${page_id}" "${relative}" >> "${ids_file}"
done < <(sed -n 's/^path = "\(.*\)"/\1/p' "${register}")

duplicates="$(cut -f1 "${ids_file}" | sort | uniq -d)"
if [[ -n "${duplicates}" ]]; then
  printf 'ERROR duplicate page IDs:\n%s\n' "${duplicates}" >&2
  errors=$((errors + 1))
fi

registered="$(wc -l < "${ids_file}")"
if [[ "${registered}" -lt 9 ]]; then
  printf 'ERROR only %s registered substantive pages; at least 9 required\n' "${registered}" >&2
  errors=$((errors + 1))
fi

# The human-readable page register exists to make page IDs auditable at a
# glance; that only holds if its "Page ID" column agrees with each page's
# own :page-id: attribute. Presence checks above do not catch drift
# between the two, so assert equality row by row.
human_register="${repo_root}/docs/wiki/_Page-Register.adoc"
register_dir="$(dirname "${human_register}")"
register_rows=0
while IFS=$'\t' read -r row_id row_path; do
  [[ -n "${row_id}" ]] || continue
  register_rows=$((register_rows + 1))
  target="${register_dir}/${row_path}"
  if [[ ! -f "${target}" ]]; then
    printf 'ERROR _Page-Register.adoc row %s links to missing page: %s\n' "${row_id}" "${row_path}" >&2
    errors=$((errors + 1))
    continue
  fi
  page_declared_id="$(sed -n 's/^:page-id:[[:space:]]*//p' "${target}" | head -n 1)"
  if [[ "${row_id}" != "${page_declared_id}" ]]; then
    printf 'ERROR _Page-Register.adoc row id %s for %s != page :page-id: %s\n' \
      "${row_id}" "${row_path}" "${page_declared_id}" >&2
    errors=$((errors + 1))
  fi
done < <(grep -E '^\|WIKI-' "${human_register}" | sed -n \
  's/^|\(WIKI-[A-Z0-9]*-[0-9]*\)[[:space:]]*|link:\([^[]*\)\[.*/\1\t\2/p')
if [[ "${register_rows}" -eq 0 ]]; then
  printf 'ERROR _Page-Register.adoc: no WIKI- rows parsed; register<->page-id check cannot be vacuous\n' >&2
  errors=$((errors + 1))
fi

# This repo's honesty tripwire: WCAG AAA has been claimed historically
# elsewhere in the estate and it is not true here. Any reappearance of an
# AAA conformance claim anywhere in the wiki is a documentation defect.
if grep -RIl "WCAG AAA" "${repo_root}/docs/wiki" >/dev/null 2>&1; then
  printf 'ERROR wiki claims WCAG AAA conformance; this repo does not meet it:\n' >&2
  grep -RIln "WCAG AAA" "${repo_root}/docs/wiki" >&2
  errors=$((errors + 1))
fi

if [[ "${errors}" -ne 0 ]]; then
  printf 'Wiki health: FAIL (%s pages checked, %s errors)\n' "${pages}" "${errors}" >&2
  exit 1
fi

printf 'Wiki health: PASS (%s registered pages; unique IDs, status metadata, and register cross-check all clean; no WCAG AAA claim found)\n' "${pages}"
