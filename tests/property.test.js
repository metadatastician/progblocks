// SPDX-License-Identifier: MPL-2.0
// Property tests for tokenize and rendering (RELEASE-CRITERIA S6). Inputs come
// from a seeded generator defined here, so a failure is reproducible from the
// seed and case number in its message, and no dependency is added.
import { describe, test, beforeAll, afterEach } from 'bun:test';
import assert from 'node:assert/strict';
import './helpers/dom.js';

let dedent;
let tokenize;

beforeAll(async () => {
  ({ dedent, tokenize } = await import('../src/prog-block.js'));
});

afterEach(() => {
  document.body.replaceChildren();
});

const SEED = 0x5eed_0006;
const CASES = 500;

/** Returns a mulberry32 generator: a deterministic stream of floats in [0, 1). */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const NAMES = ['pkg', 'host', 'a', 'x-y', 'ns:key', 'v_2'];
const DEFAULTS = ['', 'latest', '  spaced  ', '8080', '<b>bold</b>', 'a = b', '"q"'];
const FRAGMENTS = [
  'brew install ', '\n', '  ', '\t', 'echo "hi"; ', 'x = 1\n',
  // near-misses that must stay plain text
  '{{', '}}', '{{ }}', '{ {', '{{{', '}}}', '{{ a b }}', '{{=x}}', '{{ a = { }}', '{{ \n',
  // markup that must never become elements
  '<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '</code></pre>',
  '<a href="javascript:alert(1)">x</a>', '<iframe srcdoc="<b>"></iframe>', '&lt;&amp;',
  // control, bidi and astral characters
  '\u0000', '‮', '⁦', '​', '🚀', '\r\n',
];

/** Picks one element of `list` using `rand`. */
const pick = (rand, list) => list[Math.floor(rand() * list.length)];

/** Builds one variable occurrence, with or without a default and with varied spacing. */
function variable(rand) {
  const pad = () => pick(rand, ['', ' ', '  ', '\t']);
  const name = pick(rand, NAMES);
  return rand() < 0.5
    ? `{{${pad()}${name}${pad()}}}`
    : `{{${pad()}${name}${pad()}=${pick(rand, DEFAULTS)}}}`;
}

/** Generates one template source of up to 24 fragments and variables. */
function generate(rand) {
  const parts = [];
  const length = Math.floor(rand() * 24);
  for (let i = 0; i < length; i++) parts.push(rand() < 0.3 ? variable(rand) : pick(rand, FRAGMENTS));
  return parts.join('');
}

/** Runs `check(source, label)` over CASES generated sources; the label names seed and case. */
function forAll(check) {
  const rand = mulberry32(SEED);
  for (let i = 0; i < CASES; i++) check(generate(rand), `seed ${SEED.toString(16)} case ${i}`);
}

/** Computes, independently of the component, the text its code panel should show. */
function expectedCode(segments) {
  const defaults = new Map();
  for (const seg of segments) {
    if (seg.name && (!defaults.has(seg.name) || (!defaults.get(seg.name) && seg.fallback))) {
      defaults.set(seg.name, seg.fallback ?? '');
    }
  }
  return segments.map((seg) => (seg.name ? defaults.get(seg.name) || `{{ ${seg.name} }}` : seg.text)).join('');
}

/** The only elements the component itself puts in its shadow tree. */
const BUILT_TAGS = new Set(['link', 'div', 'span', 'button', 'fieldset', 'legend', 'label', 'input', 'pre', 'code']);

describe('tokenize properties', () => {
  test('segments reproduce the source exactly', () => {
    forAll((source, label) => {
      const joined = tokenize(source).map((seg) => (seg.name ? seg.raw : seg.text)).join('');
      assert.equal(joined, source, label);
    });
  });

  test('text segments are never empty or adjacent, and names are well formed', () => {
    forAll((source, label) => {
      const segments = tokenize(source);
      segments.forEach((seg, i) => {
        if (seg.name) {
          assert.match(seg.name, /^[\w:-]+$/, label);
          assert.ok(seg.fallback === null || seg.fallback === seg.fallback.trim(), `${label}: untrimmed default`);
        } else {
          assert.ok(seg.text.length > 0, `${label}: empty text segment ${i}`);
          assert.ok(!segments[i + 1] || segments[i + 1].name, `${label}: adjacent text segments at ${i}`);
        }
      });
    });
  });
});

describe('rendering properties', () => {
  test('the code panel shows exactly the substituted text and creates no authored elements', () => {
    forAll((source, label) => {
      const block = document.createElement('prog-block');
      block.textContent = source;
      document.body.append(block);

      const root = block.shadowRoot;
      const codeEl = root.querySelector('code');
      assert.equal(codeEl.textContent, expectedCode(tokenize(dedent(source))), label);

      for (const node of root.querySelectorAll('*')) {
        assert.ok(BUILT_TAGS.has(node.localName), `${label}: unexpected <${node.localName}> in shadow tree`);
      }
      for (const child of codeEl.children) {
        assert.ok(child.localName === 'span' && child.classList.contains('var-value'), `${label}: <${child.localName}> in code`);
      }
      assert.equal(root.querySelectorAll('script, img, iframe, a').length, 0, label);
      assert.equal(block.children.length, 0, `${label}: authored text became light-DOM elements`);
      block.remove();
    });
  });
});
