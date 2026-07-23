import test from 'node:test';
import assert from 'node:assert';
import { parsePaste } from '../src/modules/smart-paste.js';

test('smart-paste parsing logic', async (t) => {
  await t.test('detects basic arrays', () => {
    const mockEvent = {
      clipboardData: {
        getData: () => '[1, 2, 3]'
      }
    };
    
    const result = parsePaste(mockEvent);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.type, 'array');
  });

  await t.test('falls back to text for invalid json array', () => {
    const mockEvent = {
      clipboardData: {
        getData: () => '[1, 2, 3'
      }
    };
    
    const result = parsePaste(mockEvent);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.type, 'text');
  });

  await t.test('detects csv/matrix data', () => {
    const mockEvent = {
      clipboardData: {
        getData: () => 'col1,col2\nval1,val2'
      }
    };
    
    const result = parsePaste(mockEvent);
    assert.strictEqual(result.handled, true);
    assert.strictEqual(result.type, 'matrix');
  });
});
