import test from 'node:test';
import assert from 'node:assert';
import { parsePaste } from '../src/modules/smart-paste.js';

test('smart-paste parsing logic', async (t) => {
  await t.test('detects basic arrays and returns the parsed values', () => {
    const mockEvent = {
      clipboardData: {
        getData: () => '[1, 2, 3]'
      }
    };

    const result = parsePaste(mockEvent);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.type, 'array');
    assert.deepStrictEqual(JSON.parse(result.content), [1, 2, 3]);
  });

  await t.test('falls back to text for invalid json array, preserving the input verbatim', () => {
    const input = '[1, 2, 3';
    const mockEvent = {
      clipboardData: {
        getData: () => input
      }
    };

    const result = parsePaste(mockEvent);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.type, 'text');
    assert.strictEqual(result.content, input);
  });

  await t.test('detects csv/matrix data and preserves the rows', () => {
    const input = 'col1,col2\nval1,val2';
    const mockEvent = {
      clipboardData: {
        getData: () => input
      }
    };

    const result = parsePaste(mockEvent);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.type, 'matrix');
    assert.deepStrictEqual(result.content.split('\n'), ['col1,col2', 'val1,val2']);
  });
});
