import { test } from 'bun:test';
import assert from 'node:assert';
import './helpers/dom.js';

test('<prog-block> registers and constructs as a real HTMLElement', async () => {
  // Guards against any link-time import failure: src/prog-block.js once
  // imported a name its dependency did not export, so the module never
  // evaluated and customElements.define('prog-block', ...) never ran. It now
  // imports nothing; this test fails if a broken import ever returns.
  await import('../src/prog-block.js');

  const ProgBlockCtor = customElements.get('prog-block');
  assert.ok(ProgBlockCtor, 'customElements.get("prog-block") should be defined');

  const el = document.createElement('prog-block');
  assert.ok(el instanceof HTMLElement, 'created element should be an HTMLElement');
  assert.ok(el instanceof ProgBlockCtor, 'created element should be an instance of the registered constructor');
});
