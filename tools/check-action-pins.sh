#!/usr/bin/env bash
# SPDX-License-Identifier: MPL-2.0
#
# check-action-pins.sh -- every SHA pin resolves; every actions.lock entry
# dereferences to its commit.
#
# Run by the `pins` job in .github/workflows/ci.yml. Moved out of the workflow
# when the workflows became KYAML: KYAML writes a block scalar as one
# double-quoted string, which made this script a single escaped line that
# neither a reader nor shellcheck could use. The `uses:` pattern also accepts
# KYAML's quoted form (`uses: "owner/repo@sha"`); the unquoted-only pattern
# silently matched nothing in a KYAML workflow.
#
# Needs GH_TOKEN (or GITHUB_TOKEN) for the API.
set -uo pipefail

api() { # api <path> — sets HTTP_CODE and API_BODY
  local path="$1" auth=() out
  [ -n "${GH_TOKEN:-${GITHUB_TOKEN:-}}" ] && \
    auth=(-H "Authorization: Bearer ${GH_TOKEN:-$GITHUB_TOKEN}")
  out="$(curl -sS -w $'\n%{http_code}' --max-time 30 \
    -H 'Accept: application/vnd.github+json' \
    ${auth[@]+"${auth[@]}"} \
    "https://api.github.com/$path")" || out="{}"$'\n'000
  HTTP_CODE="${out##*$'\n'}"
  API_BODY="${out%$'\n'*}"
}

failed=0
unverified=0
count=0
declare -A default_branch=()

# 1. Every SHA-pinned uses: must name a commit that exists. Reusable
#    workflow pins must additionally be reachable from the callee's
#    default branch: GitHub refuses to resolve a called workflow at
#    an orphaned commit, with zero jobs and no check run.
pins="$(grep -rhoE '"?uses"?:[[:space:]]*"?[A-Za-z0-9_.-]+/[A-Za-z0-9_./-]+@[0-9a-f]{40}' \
          .github/workflows 2>/dev/null \
        | sed -E 's/^"?uses"?:[[:space:]]*"?//' \
        | awk -F'@' '{ split($1, p, "/"); k = ($1 ~ /\.github\/workflows\/[^\/]+\.ya?ml$/) ? "R" : "A"; print p[1] "/" p[2] "\t" $2 "\t" k }' \
        | sort -u)"

if [ -n "$pins" ]; then
  while IFS=$'\t' read -r spec sha kind; do
    [ -n "$spec" ] || continue
    count=$((count + 1))
    repo="$(printf '%s' "$spec" | cut -d/ -f1,2)"
    short="$(printf '%s' "$sha" | cut -c1-12)"

    api "repos/$repo/commits/$sha"
    case "$HTTP_CODE" in
      200) ;;
      404 | 422)
        echo "  FAIL  $spec@$short… — no such commit in $repo (HTTP $HTTP_CODE)"
        failed=$((failed + 1)); continue ;;
      *)
        echo "  UNVERIFIED  $spec@$short… — API answered HTTP $HTTP_CODE"
        unverified=$((unverified + 1)); continue ;;
    esac

    if [ "$kind" = "R" ]; then
      if [ -z "${default_branch[$repo]:-}" ]; then
        api "repos/$repo"
        if [ "$HTTP_CODE" != "200" ]; then
          echo "  UNVERIFIED  $repo — default branch unknown (HTTP $HTTP_CODE)"
          unverified=$((unverified + 1)); continue
        fi
        default_branch[$repo]="$(printf '%s' "$API_BODY" | jq -r '.default_branch // empty')"
      fi
      head="${default_branch[$repo]:-}"
      if [ -z "$head" ]; then
        echo "  UNVERIFIED  $repo — no default branch reported"
        unverified=$((unverified + 1)); continue
      fi
      api "repos/$repo/compare/$head...$sha"
      if [ "$HTTP_CODE" != "200" ]; then
        echo "  UNVERIFIED  $spec@$short… — compare answered HTTP $HTTP_CODE"
        unverified=$((unverified + 1)); continue
      fi
      status="$(printf '%s' "$API_BODY" | jq -r '.status // empty')"
      case "$status" in
        behind | identical)
          echo "  ok    $spec@$short… ($status $head, callable)" ;;
        ahead | diverged)
          echo "  FAIL  $spec@$short… — not an ancestor of $repo@$head ($status): no default-branch ref reaches it, so GitHub cannot resolve the called workflow"
          failed=$((failed + 1)) ;;
        *)
          echo "  UNVERIFIED  $spec@$short… — compare returned status '$status'"
          unverified=$((unverified + 1)) ;;
      esac
    else
      echo "  ok    $spec@$short…"
    fi
  done <<<"$pins"
fi

# 2. actions.lock integrity: every dependency key must resolve to
#    exactly the commit the lockfile records. A Dependabot bump that
#    moves uses: without regenerating the lock (the #34 class), or a
#    hand-regenerated lock naming the wrong commit, fails here with
#    a reason instead of as an annotation-less startup_failure.
while IFS= read -r key; do
  [ -n "$key" ] || continue
  count=$((count + 1))
  repo="${key%%@*}"
  ref="${key##*@}"
  recorded="$(awk -v k="    '$key':" '$0 == k { f = 1; next } f && /^        commit:/ { print; exit }' \
                .github/workflows/actions.lock | grep -oE '[0-9a-f]{40}')"
  if [ -z "$recorded" ]; then
    echo "  FAIL  $key — no commit recorded in actions.lock"
    failed=$((failed + 1)); continue
  fi

  if printf '%s' "$ref" | grep -qE '^[0-9a-f]{40}$'; then
    resolved="$ref"   # SHA-keyed dependency: the pin is its own ref
  else
    api "repos/$repo/git/ref/tags/$ref"
    case "$HTTP_CODE" in
      200)
        otype="$(printf '%s' "$API_BODY" | jq -r '.object.type')"
        osha="$(printf '%s' "$API_BODY" | jq -r '.object.sha')"
        if [ "$otype" = "tag" ]; then
          api "repos/$repo/git/tags/$osha"
          if [ "$HTTP_CODE" != "200" ]; then
            echo "  UNVERIFIED  $key — cannot dereference annotated tag (HTTP $HTTP_CODE)"
            unverified=$((unverified + 1)); continue
          fi
          resolved="$(printf '%s' "$API_BODY" | jq -r '.object.sha')"
        else
          resolved="$osha"
        fi ;;
      404 | 422)
        echo "  FAIL  $key — no such tag in $repo (HTTP $HTTP_CODE)"
        failed=$((failed + 1)); continue ;;
      *)
        echo "  UNVERIFIED  $key — tag lookup answered HTTP $HTTP_CODE"
        unverified=$((unverified + 1)); continue ;;
    esac
  fi

  if [ "$resolved" = "$recorded" ]; then
    echo "  ok    $key ($recorded)"
  else
    echo "  FAIL  $key — $ref resolves to $resolved but the lockfile records $recorded"
    failed=$((failed + 1))
  fi
done < <(grep -oE "^    '[^']+'" .github/workflows/actions.lock \
           | sed "s/^    '//; s/'$//" | grep -v '^\.github/' | sort -u)

echo
if [ "$failed" -gt 0 ]; then
  echo "::error::$failed check(s) are determinate negatives: a pin names no commit, a reusable pin is unreachable from the callee's default branch, or the lockfile disagrees with upstream."
  exit 1
fi
if [ "$unverified" -gt 0 ]; then
  echo "::warning::$unverified of $count check(s) could not be verified — the API did not answer definitively (rate limit, 5xx, network). That is a gap in this gate, not a defect in the pin; it is reported rather than failed so a GitHub incident cannot redden every run."
  echo "verified $((count - unverified)) of $count check(s); $unverified UNVERIFIED (see the warning above)"
  exit 0
fi
echo "all $count check(s) pass: every SHA pin resolves, every reusable pin is callable, every lockfile entry dereferences to its recorded commit"
