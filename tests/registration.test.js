import test from 'node:test';
import assert from 'node:assert';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register();

test('<prog-block> registers and constructs as a real HTMLElement', async () => {
  // This import would have thrown at link time if the named-import mismatch
  // against k9-validator.js (validateK9 vs defaultValidator) had not been
  // fixed — customElements.define('prog-block', ...) would never run.
  await import('../src/prog-block.js');

  const ProgBlockCtor = customElements.get('prog-block');
  assert.ok(ProgBlockCtor, 'customElements.get("prog-block") should be defined');

  const el = document.createElement('prog-block');
  assert.ok(el instanceof HTMLElement, 'created element should be an HTMLElement');
  assert.ok(el instanceof ProgBlockCtor, 'created element should be an instance of the registered constructor');
});
