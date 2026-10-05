# Justfile for ProgBlocks

set shell := ["bash", "-c"]

default: test

# Format source files
fmt:
	prettier --write src/**/*.js src/**/*.css

# Run validation checks via K9 / Nickel
check:
	nickel export contracts.ncl --format json > /tmp/progblocks-contracts.json

# Test the component
test:
	bun test

# List the documentation tree
docs:
	@find docs .machine_readable -type f \( -name '*.adoc' -o -name '*.deed' -o -name '*.ncl' \) | sort

# Gate the in-repo wiki: every page registered, attributed, unique, and drift-free
docs-health:
	./tools/check-wiki-health.sh

# Run every contractile probe and report which hold (advisory).
# Use `just probes-strict` to fail on a failing critical probe.
probes:
	./tools/run-probes.sh

probes-strict:
	./tools/run-probes.sh --strict

# Accessibility audit: axe-core in a real Chromium (set CHROMIUM_PATH)
a11y:
	bun tools/a11y-audit.mjs
