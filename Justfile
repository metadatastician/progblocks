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
	node --test
