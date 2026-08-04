# ProgBlocks

**Standalone Advanced Presentation Component for Rich Code Blocks**

ProgBlocks is an independent, highly-pluggable presentation module designed to transform interactive documentation and wikis. Conceived initially for [BerryWiki](https://github.com/metadatastician/berrywiki), it is decoupled by design so it can be injected into any system (like `ddraig-ssg` outputs, `nextgen-languages` previewers, or standalone Markdown sites).

## Features

- **Switchable Code Blocks:** Instantly toggle blocks by OS (Windows/Mac/Linux), Shell (bash/zsh/nushell), Language (AffineScript/JS/Haskell), or Citation Style (Harvard/APA/Chicago).
- **A2ML Variable Substitution & Live Previews:** Bind variables via underlying A2ML configurations. Users can toggle between "code view" and "preview view" to interactively tweak variables (e.g., font size, text strings) and watch the preview update live in the browser.
- **Smart Paste Parsing:** Intelligently map paste buffers into target formats (plain text, arrays, matrices, tuples).
- **Output & Export:** 1-click export of block data to Nickel, JSON, CSV, or TXT.
- **Decoupled Line Number Controls:** Visually toggle line numbers without polluting the copy-paste clipboard buffer.
- **Advanced Editor Tooling:** View side-by-side or top-and-bottom split-modes, and utilize "glyph/block mode" layouts.
- **Accessibility:** WCAG 2.1 AA target for all interactive elements.

## Integration

ProgBlocks is designed to be injected into existing static site generators, wiki engines, and Git forger interfaces seamlessly.

---
*Created as part of the Hyperpolymath / Metadatastician ecosystem.*
