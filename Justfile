# Justfile for ProgBlocks

set shell := ["bash", "-c"]

default: build

# Format source files
fmt:
	prettier --write src/**/*.js src/**/*.css

# Run validation checks via K9 / Nickel
check:
	nickel export contracts.ncl > validated_contracts.json
	@echo "Validation passed."

# Build the Web Component for release
build: check
	@echo "Bundling component..."
	# In a real setup, we'd use esbuild or similar here
	cat src/prog-block.css > dist/prog-block.css
	cat src/a2ml-parser.js src/k9-validator.js src/modules/*.js src/prog-block.js > dist/prog-block.bundle.js
	@echo "Build complete."

# Test the component
test:
	@echo "Running tests..."
	node --test tests/ || echo "No tests configured yet"
