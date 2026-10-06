// SPDX-License-Identifier: MPL-2.0
// Builds the GitHub wiki from docs/wiki/, which stays the canonical source.
// The GitHub wiki is one flat namespace and renders AsciiDoc without include::
// and without links to files, so this flattens the tree, inlines includes,
// rewrites page links to page names, points links outside docs/wiki/ at the
// repository on GitHub, and publishes _Navigation as the wiki's _Sidebar.
// A file with no `= Title` line is a fragment: it is included, never published.
// Usage: bun tools/publish-wiki.mjs <wiki-clone-dir> [--source <commit>]
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, posix, resolve } from 'node:path';

const REPO_BLOB = 'https://github.com/metadatastician/progblocks/blob/main/';
const INCLUDE = /^include::([^\[\s]+)\[\]$/gm;
const LINK = /link:([^\[\s]+)\[/g;
const MAX_INCLUDE_DEPTH = 4;

/** Lists every `.adoc` file under `root`, as POSIX paths relative to it. */
export function listPages(root, sub = '') {
  const out = [];
  for (const entry of readdirSync(join(root, sub), { withFileTypes: true })) {
    const rel = sub ? `${sub}/${entry.name}` : entry.name;
    if (entry.isDirectory()) out.push(...listPages(root, rel));
    else if (entry.name.endsWith('.adoc')) out.push(rel);
  }
  return out.sort();
}

/** Returns the wiki page name for a page path: its basename, with `_Navigation` as `_Sidebar` and any other leading `_` dropped. */
export function pageName(rel) {
  const base = posix.basename(rel, '.adoc');
  if (base === '_Navigation') return '_Sidebar';
  return base.replace(/^_+/, '');
}

/**
 * Builds the wiki in memory. Returns a Map from output file name to text,
 * leaving out fragments (files with no `= Title` line).
 * Throws on two pages with one name, a missing include, a link to a missing
 * file, or a link that leaves the repository.
 */
export function buildWiki(wikiRoot, { repoRoot = resolve(wikiRoot, '../..'), source = 'main' } = {}) {
  const prefix = posix.relative(repoRoot.split('\\').join('/'), resolve(wikiRoot).split('\\').join('/'));
  const pages = listPages(wikiRoot);
  const names = new Map();
  for (const rel of pages) {
    const name = pageName(rel);
    if (names.has(name)) throw new Error(`two pages publish as "${name}": ${names.get(name)} and ${rel}`);
    names.set(name, rel);
  }
  const byPath = new Map(pages.map((rel) => [rel, pageName(rel)]));

  /** Rewrites one link target found in page `rel`. */
  const rewriteLink = (target, rel) => {
    if (/^[a-z][a-z0-9+.-]*:/i.test(target) || target.startsWith('#')) return target;
    const [path, anchor = ''] = target.split(/(?=#)/);
    const inRepo = posix.normalize(posix.join(prefix, posix.dirname(rel), path));
    if (inRepo.startsWith('..')) throw new Error(`${rel}: link leaves the repository: ${target}`);
    const inWiki = posix.relative(prefix, inRepo);
    if (!inWiki.startsWith('..') && byPath.has(inWiki)) return byPath.get(inWiki) + anchor;
    if (!existsSync(join(repoRoot, inRepo))) throw new Error(`${rel}: link to a missing file: ${target}`);
    return REPO_BLOB + inRepo + anchor;
  };

  /** Inlines includes and rewrites links in `text`, which was read from page `rel`. */
  const transform = (text, rel, depth = 0) => {
    const inlined = text.replace(INCLUDE, (_, target) => {
      if (depth >= MAX_INCLUDE_DEPTH) throw new Error(`${rel}: includes nest deeper than ${MAX_INCLUDE_DEPTH}`);
      const inc = posix.normalize(posix.join(posix.dirname(rel), target));
      const file = join(wikiRoot, inc);
      if (!existsSync(file)) throw new Error(`${rel}: include of a missing file: ${target}`);
      const body = readFileSync(file, 'utf8').replace(/^\/\/ SPDX-License-Identifier:.*\n/m, '').trimEnd();
      return transform(body, inc, depth + 1);
    });
    return inlined.replace(LINK, (_, target) => `link:${rewriteLink(target, rel)}[`);
  };

  const out = new Map();
  for (const rel of pages) {
    const raw = readFileSync(join(wikiRoot, rel), 'utf8');
    if (!/^= /m.test(raw)) continue;
    let text = transform(raw, rel);
    if (pageName(rel) !== '_Sidebar') text = addBanner(text, `${prefix}/${rel}`, source);
    out.set(`${pageName(rel)}.adoc`, text);
  }
  return out;
}

/** Inserts a note naming the canonical source file after the page's document header. */
function addBanner(text, sourcePath, source) {
  const note = `NOTE: Generated from link:${REPO_BLOB}${sourcePath}[\`${sourcePath}\`] at \`${source}\`. ` +
    'Edit that file, not this page: the next publish overwrites it.\n';
  const title = text.search(/^= /m);
  if (title < 0) return note + '\n' + text;
  const headerEnd = text.indexOf('\n\n', title);
  if (headerEnd < 0) return text + '\n\n' + note;
  return text.slice(0, headerEnd + 2) + note + '\n' + text.slice(headerEnd + 2);
}

/** Writes the built pages into `outDir`, first removing its top-level `.md` and `.adoc` pages so a deleted page does not linger. */
export function writeWiki(outDir, pages) {
  for (const entry of readdirSync(outDir, { withFileTypes: true })) {
    if (entry.isFile() && /\.(md|adoc)$/.test(entry.name)) rmSync(join(outDir, entry.name));
  }
  for (const [name, text] of pages) writeFileSync(join(outDir, name), text);
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const outDir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--source');
  const sourceAt = args.indexOf('--source');
  if (!outDir) {
    console.error('usage: bun tools/publish-wiki.mjs <wiki-clone-dir> [--source <commit>]');
    process.exit(2);
  }
  const wikiRoot = resolve(import.meta.dir, '../docs/wiki');
  const pages = buildWiki(wikiRoot, { source: sourceAt >= 0 ? args[sourceAt + 1] : 'main' });
  writeWiki(outDir, pages);
  console.log(`wrote ${pages.size} pages to ${outDir}`);
}
