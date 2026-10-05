// SPDX-License-Identifier: MPL-2.0
// Tests for tools/jcs.mjs: RFC 8785 canonical output and RFC 7493 I-JSON checks.
import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';
import { canonicalText } from '../tools/jcs.mjs';

const BS = '\\';
const Q = '"';

describe('RFC 8785 canonicalisation', () => {
  test('reproduces the RFC 8785 §3.2.3 sample output exactly', () => {
    // Built from parts so no escape sequence is interpreted before the parser sees it.
    const u = (hex) => `${BS}u${hex}`;
    const str = `${u('20ac')}$${u('000F')}${u('000a')}A'${u('0042')}${u('0022')}${u('005c')}${BS}${BS}${BS}${Q}${BS}/`;
    const input = `{\n  "numbers": [333333333.33333329, 1E30, 4.50, 2e-3, 0.000000000000000000000000001],\n  "string": "${str}",\n  "literals": [null, true, false]\n}`;
    const expected = `{"literals":[null,true,false],"numbers":[333333333.3333333,1e+30,4.5,0.002,1e-27],"string":"€$${BS}u000f${BS}nA'B${BS}${Q}${BS}${BS}${BS}${BS}${BS}${Q}/"}`;
    assert.equal(canonicalText(input), expected);
  });

  test('sorts members by UTF-16 code units, including non-BMP keys', () => {
    assert.equal(canonicalText('{"😀":1,"€":2,"a":3,"1":4}'), '{"1":4,"a":3,"€":2,"😀":1}');
  });

  test('serialises numbers the ECMAScript way', () => {
    assert.equal(canonicalText('[-0,1.0,1e21,1e-7,5e-324]'), '[0,1,1e+21,1e-7,5e-324]');
  });
});

describe('RFC 7493 I-JSON rejection', () => {
  for (const [name, text] of [
    ['duplicate member names', '{"k":1,"k":2}'],
    ['duplicate names in a nested object', '[{"a":{"x":1,"x":1}}]'],
    ['a lone high surrogate', `["${BS}ud800"]`],
    ['a lone low surrogate', `["${BS}udc00"]`],
    ['a number outside the double range', '[1e400]'],
    ['trailing content', '{"a":1} x'],
  ]) {
    test(`rejects ${name}`, () => assert.throws(() => canonicalText(text)));
  }

  test('accepts a valid surrogate pair and the same name in sibling objects', () => {
    assert.equal(canonicalText(`[{"a":1},{"a":2},"${BS}ud83d${BS}ude00"]`), '[{"a":1},{"a":2},"😀"]');
  });
});
