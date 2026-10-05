# ProgBlocks architecture

This describes the code as it exists in this checkout. See [`README.md`](./README.md) for the authoring
reference and [`EXPLAINME.adoc`](./EXPLAINME.adoc) for claim-by-claim evidence.

## Boundaries

ProgBlocks is one custom element. It renders code examples with variants and reader-supplied values.
It has no runtime dependencies and needs no build step, no framework and no host system. BerryWiki,
`ddraig-ssg` or a plain HTML page adopt it the same way: load one ES module and write `<prog-block>`.
Hosts couple to it only through the documented surface: attributes, five script members, two events,
`--pb-*` custom properties and `::part()` names.

Out of scope by charter: editing code, linting, language servers, structured export formats. Persistence
is limited to one opt-in item: with `persist` (and `group`), the reader's variant name is stored in
`localStorage` under `progblocks:variant:<group>`. Nothing else is stored.

## Module map

| File | Responsibility |
|---|---|
| `src/prog-block.js` | The `<prog-block>` element, plus the pure helpers `dedent()` and `tokenize()` (exported for tests). |
| `src/prog-block.css` | Shadow-DOM styles, all colours as `--pb-*` custom properties. |
| `src/a2ml-parser.js` | **Stub, not imported.** Kept pending a decision on whether a real A2ML parser belongs here. |
| `src/k9-validator.js` | **Not imported** by the component. Estate K9 manifest tooling. |
| `index.html` | Demo page. |

## Render model: build once, patch in place

The shadow tree is built once, in `_build()`, on first connect, and rebuilt only when the authored
content changes (see below). Only DOM APIs are used:
`createElement`, `setAttribute` and `textContent`. There is no `innerHTML` anywhere in `src/`. Later
changes patch the nodes they affect:

| Change | Patch |
|---|---|
| Reader types into a variable input | `_renderValues(name)` sets `textContent` on that variable's `<span>`s only. The input element is never replaced, so focus and caret survive. |
| Variant selected | `_renderVariant()` updates `aria-selected`/`tabindex` on the tabs and replaces the children of `<code>` with fresh text nodes and variable spans. |
| `line-numbers` toggled | `_renderLineNumbers()` shows or hides the gutter and resizes it to the line count. |
| `language` changed | `_renderLanguage()` updates the label and the `language-*` class. |
| Authored light DOM changes (children, text, `data-variant`) | A `MutationObserver` on the host schedules `refresh()`, coalesced to one per microtask. `refresh()` re-reads the light DOM, replaces the shadow tree, then restores the selected variant by name and the reader's values. The inputs are new elements, so focus inside the block is lost; this is host-driven and rare. Edits to a `<template>`'s `.content` are invisible to observers; call `refresh()` after them. The observer disconnects on disconnect. |

**Why this matters for security.** Variant content is read with `template.content.textContent`. The
browser has already parsed the template, so any tags in it are dropped and only their text survives.
That text is then written back with `textContent`. Tab labels, variable names and reader input follow
the same path. No route exists from author or reader input to parsed markup.
`tests/component.test.js` asserts this for each input path. On 2026-10-05 it was checked by hand:
replacing one `textContent` with `innerHTML` failed the suite. That check is not automated.

## Data model

```
_variants : [{ name, segments }]        segments = tokenize(dedent(source))
              segment = { text } | { name, fallback, raw }
_defaults : Map name → default          first non-empty `{{ name = default }}` across all variants
_values   : Map name → reader value     shared across variants
```

A variable's displayed value is the reader's value, else its default, else the literal `{{ name }}`
(styled `.unset`). The variable set is fixed when the block is read, so switching variants never adds or
removes inputs.

## Variants and groups

Tabs follow the WAI-ARIA tabs pattern with automatic activation. `group="x"` registers the block in a
module-level `Map<name, Set<ProgBlock>>`. After a reader-initiated selection the block asks its peers to
select the same variant *name*. Peers that lack that name ignore the request. Programmatic selection
(`variant=`, `.variant =`) does not propagate, so blocks cannot ping-pong. Blocks leave their group on
disconnect.

With `persist`, a reader-initiated selection also writes the variant name to `localStorage` under
`progblocks:variant:<group>`; on first connect a remembered name takes precedence over the `variant`
attribute, and a name the block lacks leaves the first variant selected. Every storage access is in
`try`/`catch`, so blocked storage degrades to page-local sync. There is no `storage` event listener, so
other open tabs do not follow.

## Styling

The stylesheet `<link>` href is `new URL('./prog-block.css', import.meta.url)`, which resolves against
the module rather than the hosting page. That makes it work at any page depth and from a CDN.

## Known limitations

- ~~Light-DOM changes after first connect are not observed.~~ Observed since 2026-10-05; edits to a
  `<template>`'s `.content` still need `refresh()`, and a rebuild loses focus inside the block.
- Group selection is page-local unless `persist` is set; even then there is no cross-tab sync.
- No syntax highlighting. A host highlighter can target `code.language-*` through `::part(code)`, but
  ProgBlocks does not run one.
