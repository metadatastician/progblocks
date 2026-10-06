// SPDX-License-Identifier: MPL-2.0
// Tests for tools/publish-wiki.mjs: the GitHub wiki built from docs/wiki/.
import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';
import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { buildWiki, pageName, writeWiki } from '../tools/publish-wiki.mjs';

const WIKI = resolve(import.meta.dir, '../docs/wiki');
const LINK = /link:([^\[\s]+)\[/g;

/** Creates a throwaway repository with the given files and returns its root. */
function fixture(files) {
  const root = mkdtempSync(join(tmpdir(), 'pb-wiki-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), text);
  }
  return root;
}

describe('the wiki built from docs/wiki/', () => {
  const pages = buildWiki(WIKI, { source: 'test' });

  test('publishes every page, with _Navigation as the sidebar', () => {
    assert.ok(pages.has('Home.adoc'));
    assert.ok(pages.has('_Sidebar.adoc'));
    assert.ok(!pages.has('_Navigation.adoc'));
    assert.ok(pages.size >= 11, `only ${pages.size} pages`);
  });

  test('leaves no include:: for GitHub to drop, and inlines the status panel', () => {
    for (const [name, text] of pages) assert.ok(!text.includes('include::'), name);
    assert.match(pages.get('Home.adoc'), /\|Page ID \|\{page-id\}/);
    assert.ok(!pages.has('Status-Panel.adoc'), 'a titleless fragment is not a page');
  });

  test('every relative link names a published page', () => {
    for (const [name, text] of pages) {
      for (const [, target] of text.matchAll(LINK)) {
        if (/^https:\/\//.test(target) || target.startsWith('#')) continue;
        assert.ok(pages.has(`${target.split('#')[0]}.adoc`), `${name} links to ${target}`);
      }
    }
  });

  test('every page but the sidebar names its canonical source', () => {
    for (const [name, text] of pages) {
      if (name === '_Sidebar.adoc') continue;
      assert.match(text, /NOTE: Generated from link:https:\/\/github\.com\/metadatastician\/progblocks\/blob\/main\/docs\/wiki\//, name);
    }
  });
});

describe('publishing refuses a wiki it cannot render faithfully', () => {
  test('a link to a missing page', () => {
    const root = fixture({ 'docs/wiki/Home.adoc': '= Home\n\nlink:Gone.adoc[gone]\n' });
    assert.throws(() => buildWiki(join(root, 'docs/wiki')), /missing file: Gone\.adoc/);
  });

  test('two pages that would publish under one name', () => {
    const root = fixture({ 'docs/wiki/a/Page.adoc': '= A\n', 'docs/wiki/b/Page.adoc': '= B\n' });
    assert.throws(() => buildWiki(join(root, 'docs/wiki')), /two pages publish as "Page"/);
  });

  test('a link that leaves the repository', () => {
    const root = fixture({ 'docs/wiki/Home.adoc': '= Home\n\nlink:../../../etc/passwd[x]\n' });
    assert.throws(() => buildWiki(join(root, 'docs/wiki')), /leaves the repository/);
  });

  test('a missing include', () => {
    const root = fixture({ 'docs/wiki/Home.adoc': '= Home\n\ninclude::_Panel.adoc[]\n' });
    assert.throws(() => buildWiki(join(root, 'docs/wiki')), /include of a missing file/);
  });
});

describe('link rewriting', () => {
  test('page links become page names, keeping the anchor; repository files become GitHub links', () => {
    const root = fixture({
      'docs/wiki/Home.adoc': '= Home\n\nlink:users/Guide.adoc#start[guide] link:../../README.md[readme] link:https://x.test/[x]\n',
      'docs/wiki/users/Guide.adoc': '= Guide\n\nlink:../Home.adoc[home]\n',
      'README.md': '# r\n',
    });
    const pages = buildWiki(join(root, 'docs/wiki'));
    const home = pages.get('Home.adoc');
    assert.match(home, /link:Guide#start\[guide\]/);
    assert.match(home, /link:https:\/\/github\.com\/metadatastician\/progblocks\/blob\/main\/README\.md\[readme\]/);
    assert.match(home, /link:https:\/\/x\.test\/\[x\]/);
    assert.match(pages.get('Guide.adoc'), /link:Home\[home\]/);
  });

  test('page names drop a leading underscore, except _Navigation', () => {
    assert.equal(pageName('_Page-Register.adoc'), 'Page-Register');
    assert.equal(pageName('_Navigation.adoc'), '_Sidebar');
    assert.equal(pageName('users/Getting-Started.adoc'), 'Getting-Started');
  });
});

describe('writing into a wiki clone', () => {
  test('replaces stale pages and leaves everything else alone', () => {
    const out = fixture({ 'Old.md': 'stale', '.git/HEAD': 'ref', 'notes.txt': 'keep' });
    writeWiki(out, new Map([['Home.adoc', '= Home\n']]));
    assert.ok(!existsSync(join(out, 'Old.md')));
    assert.ok(existsSync(join(out, 'Home.adoc')));
    assert.ok(existsSync(join(out, '.git/HEAD')));
    assert.ok(existsSync(join(out, 'notes.txt')));
  });
});
