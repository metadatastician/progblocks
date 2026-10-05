// SPDX-License-Identifier: MPL-2.0
// tools/jcs.mjs — check or rewrite JSON files as RFC 8785 (JCS) canonical
// JSON, after validating them as RFC 7493 I-JSON.
//
//   bun tools/jcs.mjs check FILE...   exit 0 all canonical, 1 any not canonical, 2 any invalid
//   bun tools/jcs.mjs fix FILE...     rewrite valid files canonically (one trailing "\n")
//   bun tools/jcs.mjs canon           stdin -> canonical bytes on stdout (no newline)
//
// A file is canonical when its bytes are the JCS form followed by at most one
// "\n" — the same rule as the ijson-jcs CLI (hyperpolymath/ijson-jcs), which
// this script is cross-checked against. JavaScript is RFC 8785's reference
// semantics: numbers and strings serialise exactly as JSON.stringify does, and
// object members sort by UTF-16 code units, which is the default string sort.
// JSON.parse alone is not enough for I-JSON: it keeps the last duplicate key
// and accepts lone surrogates, so `assertIJson` scans the text first.

/**
 * Throws if `text` is not I-JSON: a duplicate member name in any object, a
 * lone surrogate in any string, or a number that is not a finite double.
 * Grammar errors are left to JSON.parse, which runs afterwards.
 */
export function assertIJson(text) {
  let i = 0;
  const ws = () => { while (' \t\n\r'.includes(text[i]) && i < text.length) i++; };
  const fail = (why) => { throw new Error(`${why} at offset ${i}`); };
  const string = () => {
    const start = i;
    i++;
    while (i < text.length && text[i] !== '"') i += text[i] === '\\' ? 2 : 1;
    i++;
    const value = JSON.parse(text.slice(start, i));
    for (let k = 0; k < value.length; k++) {
      const c = value.charCodeAt(k);
      if (c >= 0xd800 && c <= 0xdbff) {
        const d = value.charCodeAt(k + 1);
        if (!(d >= 0xdc00 && d <= 0xdfff)) fail('lone surrogate');
        k++;
      } else if (c >= 0xdc00 && c <= 0xdfff) fail('lone surrogate');
    }
    return value;
  };
  const value = () => {
    ws();
    const c = text[i];
    if (c === '{') {
      i++;
      const seen = new Set();
      ws();
      if (text[i] === '}') { i++; return; }
      for (;;) {
        ws();
        if (text[i] !== '"') fail('expected member name');
        const key = string();
        if (seen.has(key)) fail(`duplicate member name ${JSON.stringify(key)}`);
        seen.add(key);
        ws();
        if (text[i++] !== ':') fail('expected ":"');
        value();
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === '}') { i++; return; }
        fail('expected "," or "}"');
      }
    }
    if (c === '[') {
      i++;
      ws();
      if (text[i] === ']') { i++; return; }
      for (;;) {
        value();
        ws();
        if (text[i] === ',') { i++; continue; }
        if (text[i] === ']') { i++; return; }
        fail('expected "," or "]"');
      }
    }
    if (c === '"') { string(); return; }
    const m = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|^(?:true|false|null)/.exec(text.slice(i));
    if (!m) fail('unexpected token');
    if (m[0][0] === '-' || /\d/.test(m[0][0])) {
      if (!Number.isFinite(Number(m[0]))) fail(`number ${m[0]} is outside the IEEE-754 double range`);
    }
    i += m[0].length;
  };
  value();
  ws();
  if (i < text.length) fail('trailing content');
}

/** Serialises a parsed JSON value as RFC 8785 canonical JSON text. */
export function canonicalize(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonicalize).join(',') + ']';
  return '{' + Object.keys(value).sort().map((k) => JSON.stringify(k) + ':' + canonicalize(value[k])).join(',') + '}';
}

/** Validates `text` as I-JSON and returns its canonical form. */
export function canonicalText(text) {
  assertIJson(text);
  return canonicalize(JSON.parse(text));
}

/** Runs the command line; returns the process exit code. */
async function main([command, ...files]) {
  if (command === 'canon') {
    try {
      process.stdout.write(canonicalText(await Bun.stdin.text()));
      return 0;
    } catch (e) {
      console.error(`INVALID <stdin>: ${e.message}`);
      return 2;
    }
  }
  if ((command !== 'check' && command !== 'fix') || files.length === 0) {
    console.error('usage: bun tools/jcs.mjs check|fix FILE...  |  bun tools/jcs.mjs canon < FILE');
    return 2;
  }
  let worst = 0;
  for (const file of files) {
    let text;
    let canon;
    try {
      text = await Bun.file(file).text();
      canon = canonicalText(text);
    } catch (e) {
      console.log(`INVALID ${file}: ${e.message}`);
      worst = 2;
      continue;
    }
    if (text === canon || text === canon + '\n') {
      console.log(`OK ${file}`);
    } else if (command === 'fix') {
      await Bun.write(file, canon + '\n');
      console.log(`FIXED ${file}`);
    } else {
      console.log(`NOT CANONICAL ${file}`);
      worst = Math.max(worst, 1);
    }
  }
  return worst;
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
