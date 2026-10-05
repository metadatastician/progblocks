// SPDX-License-Identifier: MPL-2.0
// Behavioural tests for <prog-block>: rendering safety, variants, variables, a11y.
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

/** Mounts markup into the document and returns the first <prog-block>. */
function mount(html) {
  const host = document.createElement('div');
  host.innerHTML = html;
  document.body.append(host);
  return host.querySelector('prog-block');
}

/** Returns the visible code text of a block. */
const code = (block) => block.shadowRoot.querySelector('code').textContent;
/** Returns a block's tab buttons in order. */
const tabs = (block) => [...block.shadowRoot.querySelectorAll('[role="tab"]')];
/** Dispatches a keydown for key `k` on `target`. */
const key = (target, k) => target.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true }));

const THREE_OS = `
  <prog-block>
    <template data-variant="macOS">brew install {{ pkg }}</template>
    <template data-variant="Windows">choco install {{ pkg }}</template>
    <template data-variant="Linux">apt-get install {{ pkg }}</template>
  </prog-block>`;

describe('untrusted content is never rendered as markup', () => {
  test('escaped markup in a variant renders as literal text', () => {
    const block = mount('<prog-block><template data-variant="a">&lt;img src=x onerror="window.pwned=1"&gt;</template></prog-block>');
    assert.equal(code(block), '<img src=x onerror="window.pwned=1">');
    assert.equal(block.shadowRoot.querySelector('img'), null);
  });

  test('unescaped markup in a template yields no elements in the shadow tree', () => {
    const block = mount('<prog-block><template data-variant="a"><img src=x onerror="window.pwned=1">text</template></prog-block>');
    assert.equal(block.shadowRoot.querySelector('img'), null);
    assert.equal(code(block), 'text');
  });

  test('a variable value containing markup is inserted as text', () => {
    const block = mount('<prog-block><template data-variant="a">echo {{ name }}</template></prog-block>');
    const input = block.shadowRoot.querySelector('input');
    input.value = '<img src=x onerror=alert(1)>';
    input.dispatchEvent(new Event('input'));
    assert.equal(block.shadowRoot.querySelector('img'), null);
    assert.equal(code(block), 'echo <img src=x onerror=alert(1)>');
  });

  test('tab labels and variable names are text, not markup', () => {
    const block = mount('<prog-block><template data-variant="&lt;b&gt;x&lt;/b&gt;">1</template><template data-variant="y">2</template></prog-block>');
    assert.equal(tabs(block)[0].textContent, '<b>x</b>');
    assert.equal(block.shadowRoot.querySelector('b'), null);
  });
});

describe('variable substitution', () => {
  test('typing keeps the same input element and updates the code in place', () => {
    const block = mount('<prog-block><template data-variant="a">echo {{ name }} {{ name }}</template></prog-block>');
    const input = block.shadowRoot.querySelector('input');
    for (const value of ['a', 'ad', 'ada']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      assert.equal(block.shadowRoot.querySelector('input'), input, 'input must not be recreated');
    }
    assert.equal(code(block), 'echo ada ada');
  });

  test('unset variables keep their placeholder visible', () => {
    const block = mount('<prog-block>echo {{ name }}</prog-block>');
    assert.equal(code(block), 'echo {{ name }}');
    assert.ok(block.shadowRoot.querySelector('.var-value.unset'));
  });

  test('inline defaults fill the example and the input placeholder', () => {
    const block = mount('<prog-block>size={{ size = 12 }}</prog-block>');
    assert.equal(code(block), 'size=12');
    assert.equal(block.shadowRoot.querySelector('input').placeholder, '12');
    block.setVariable('size', '16');
    assert.equal(code(block), 'size=16');
  });

  test('values persist across variant switches and one input serves all variants', () => {
    const block = mount(THREE_OS);
    assert.equal(block.shadowRoot.querySelectorAll('input').length, 1);
    block.setVariable('pkg', 'jq');
    tabs(block)[2].click();
    assert.equal(code(block), 'apt-get install jq');
  });

  test('every input has an associated label', () => {
    const block = mount('<prog-block>{{ a }} {{ b }}</prog-block>');
    for (const input of block.shadowRoot.querySelectorAll('input')) {
      assert.ok(block.shadowRoot.querySelector(`label[for="${input.id}"]`), `no label for ${input.id}`);
    }
  });

  test('emits progblocks:variable-change', () => {
    const block = mount('<prog-block>{{ a }}</prog-block>');
    let detail;
    document.addEventListener('progblocks:variable-change', (e) => { detail = e.detail; }, { once: true });
    block.setVariable('a', 'x');
    assert.deepEqual(detail, { name: 'a', value: 'x' });
  });
});

describe('variant switching', () => {
  test('tabs follow the WAI-ARIA tabs pattern', () => {
    const block = mount(THREE_OS);
    const [mac, win] = tabs(block);
    const panel = block.shadowRoot.querySelector('[role="tabpanel"]');
    assert.equal(mac.getAttribute('aria-selected'), 'true');
    assert.equal(mac.tabIndex, 0);
    assert.equal(win.tabIndex, -1);
    assert.equal(mac.getAttribute('aria-controls'), panel.id);
    assert.equal(panel.getAttribute('aria-labelledby'), mac.id);
  });

  test('arrow keys, Home and End move selection with wrap-around', () => {
    const block = mount(THREE_OS);
    const [mac, , linux] = tabs(block);
    key(mac, 'ArrowLeft');
    assert.equal(block.variant, 'Linux');
    key(linux, 'ArrowRight');
    assert.equal(block.variant, 'macOS');
    key(mac, 'End');
    assert.equal(block.variant, 'Linux');
    key(linux, 'Home');
    assert.equal(block.variant, 'macOS');
    assert.match(code(block), /^brew/);
  });

  test('the variant attribute picks the initial variant', () => {
    const block = mount(THREE_OS.replace('<prog-block>', '<prog-block variant="Windows">'));
    assert.match(code(block), /^choco/);
  });

  test('blocks in the same group switch together; other groups do not', () => {
    const a = mount(THREE_OS.replace('<prog-block>', '<prog-block group="os">'));
    const b = mount(THREE_OS.replace('<prog-block>', '<prog-block group="os">'));
    const c = mount(THREE_OS.replace('<prog-block>', '<prog-block group="other">'));
    tabs(a)[1].click();
    assert.equal(b.variant, 'Windows');
    assert.equal(c.variant, 'macOS');
  });

  test('emits progblocks:variant-change for reader selection only', () => {
    const block = mount(THREE_OS);
    const seen = [];
    document.addEventListener('progblocks:variant-change', (e) => seen.push(e.detail.variant));
    tabs(block)[1].click();
    block.variant = 'Linux';
    assert.deepEqual(seen, ['Windows']);
  });

  test('a single variant renders no tablist', () => {
    const block = mount('<prog-block language="js">let x = 1;</prog-block>');
    assert.equal(block.shadowRoot.querySelector('[role="tablist"]'), null);
    assert.equal(block.shadowRoot.querySelector('code').className, 'language-js');
    const panel = block.shadowRoot.querySelector('pre');
    assert.equal(panel.getAttribute('role'), 'group', 'aria-label needs a role that supports naming');
    assert.equal(panel.getAttribute('aria-label'), 'Code example');
  });
});

describe('embedding', () => {
  test('stylesheet resolves against the module, not the host page', () => {
    const block = mount('<prog-block>x</prog-block>');
    const href = block.shadowRoot.querySelector('link[rel="stylesheet"]').getAttribute('href');
    assert.ok(href.endsWith('/src/prog-block.css'), href);
    assert.ok(!href.startsWith('./'), href);
  });

  test('copy writes the personalised text and announces it', async () => {
    let written;
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async (t) => { written = t; } } });
    const block = mount(THREE_OS);
    block.setVariable('pkg', 'jq');
    await block._copy();
    assert.equal(written, 'brew install jq');
    assert.equal(block.shadowRoot.querySelector('[role="status"]').textContent, 'Copied to clipboard');
  });

  test('download saves the personalised text under the filename attribute', async () => {
    const created = [];
    const origCreate = URL.createObjectURL;
    URL.createObjectURL = (blob) => { created.push(blob); return 'blob:test'; };
    const block = mount(THREE_OS.replace('<prog-block>', '<prog-block filename="../install.sh">'));
    block.setVariable('pkg', 'jq');
    let clicked;
    block.shadowRoot.addEventListener('click', (e) => { if (e.target.tagName === 'A') { clicked = e.target.getAttribute('download'); e.preventDefault(); } });
    block.shadowRoot.querySelector('.download').click();
    URL.createObjectURL = origCreate;
    assert.equal(clicked, '.._install.sh');
    assert.equal(await created[0].text(), 'brew install jq');
    assert.equal(block.shadowRoot.querySelector('a'), null, 'temporary link is removed');
  });

  test('line numbers match the line count and are hidden from assistive tech', () => {
    const block = mount('<prog-block line-numbers><template data-variant="a">\n  one\n  two\n  three\n</template></prog-block>');
    const gutter = block.shadowRoot.querySelector('.line-numbers');
    assert.equal(gutter.getAttribute('aria-hidden'), 'true');
    assert.equal(gutter.children.length, 3);
    assert.equal(code(block), 'one\ntwo\nthree');
  });
});

describe('remembering the reader\'s variant', () => {
  afterEach(() => localStorage.clear());
  const OS_PERSIST = THREE_OS.replace('<prog-block>', '<prog-block group="os" persist>');

  test('persist stores a reader choice and restores it on the next page', () => {
    tabs(mount(OS_PERSIST))[2].click();
    assert.equal(localStorage.getItem('progblocks:variant:os'), 'Linux');
    document.body.replaceChildren();
    assert.equal(mount(OS_PERSIST).variant, 'Linux');
  });

  test('without persist nothing is stored', () => {
    tabs(mount(THREE_OS.replace('<prog-block>', '<prog-block group="os">')))[1].click();
    assert.equal(localStorage.getItem('progblocks:variant:os'), null);
  });

  test('a remembered name the block lacks falls back to the first variant', () => {
    localStorage.setItem('progblocks:variant:os', 'BeOS');
    assert.equal(mount(OS_PERSIST).variant, 'macOS');
  });

  test('a choice persisted in another tab is followed here, without echo', () => {
    const block = mount(OS_PERSIST);
    const plain = mount(THREE_OS.replace('<prog-block>', '<prog-block group="os">'));
    let events = 0;
    document.addEventListener('progblocks:variant-change', () => events++);
    window.dispatchEvent(new StorageEvent('storage', { key: 'progblocks:variant:os', newValue: 'Linux' }));
    assert.equal(block.variant, 'Linux');
    assert.equal(plain.variant, 'macOS', 'blocks without persist ignore other tabs');
    assert.equal(events, 0);
    assert.equal(localStorage.getItem('progblocks:variant:os'), null, 'no write-back echo');
  });

  test('unrelated storage keys are ignored', () => {
    const block = mount(OS_PERSIST);
    window.dispatchEvent(new StorageEvent('storage', { key: 'other', newValue: 'Linux' }));
    window.dispatchEvent(new StorageEvent('storage', { key: 'progblocks:variant:os', newValue: null }));
    assert.equal(block.variant, 'macOS');
  });

  test('blocked storage degrades silently', () => {
    const real = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
    try {
      const block = mount(OS_PERSIST);
      tabs(block)[1].click();
      assert.equal(block.variant, 'Windows');
    } finally {
      Object.defineProperty(globalThis, 'localStorage', real);
    }
  });
});

describe('authored content that changes after render', () => {
  const tick = () => new Promise((r) => setTimeout(r, 0));

  test('replacing templates re-renders, keeping the variant and reader values', async () => {
    const block = mount(THREE_OS);
    tabs(block)[1].click();
    block.setVariable('pkg', 'jq');
    const fresh = document.createElement('template');
    fresh.setAttribute('data-variant', 'Windows');
    fresh.innerHTML = 'scoop install {{ pkg }}';
    block.replaceChildren(fresh);
    await tick();
    assert.equal(tabs(block).length, 0, 'one variant now, so no tablist');
    assert.equal(code(block), 'scoop install jq');
    assert.equal(block.shadowRoot.querySelector('input').value, 'jq');
  });

  test('editing plain-text content is picked up', async () => {
    const block = mount('<prog-block>echo one</prog-block>');
    block.firstChild.data = 'echo two';
    await tick();
    assert.equal(code(block), 'echo two');
  });

  test('refresh() picks up edits inside template.content', () => {
    const block = mount(THREE_OS);
    block.querySelector('template').content.textContent = 'port install {{ pkg }}';
    block.refresh();
    assert.equal(code(block), 'port install {{ pkg }}');
  });

  test('a burst of mutations triggers one rebuild', async () => {
    const block = mount(THREE_OS);
    let builds = 0;
    const original = block._build.bind(block);
    block._build = () => { builds++; original(); };
    for (const t of block.querySelectorAll('template')) t.setAttribute('data-variant', t.getAttribute('data-variant') + '!');
    await tick();
    assert.equal(builds, 1);
    assert.equal(tabs(block)[0].textContent, 'macOS!');
  });
});

describe('pure helpers', () => {
  test('dedent strips common indentation and blank edges', () => {
    assert.equal(dedent('\n    a\n      b\n    c\n  '), 'a\n  b\nc');
  });

  test('tokenize separates text and variables with defaults', () => {
    assert.deepEqual(tokenize('x {{ a = 1 }} y'), [
      { text: 'x ' },
      { name: 'a', fallback: '1', raw: '{{ a = 1 }}' },
      { text: ' y' },
    ]);
  });
});
