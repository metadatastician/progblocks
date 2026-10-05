// SPDX-License-Identifier: MPL-2.0
// Audits index.html with axe-core (WCAG 2.0/2.1/2.2 A+AA and best practice) in a
// real Chromium, in dark and light colour schemes. Exits 1 on any violation.
// Usage: CHROMIUM_PATH=/path/to/chrome bun tools/a11y-audit.mjs
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

/** Serves the repository root over HTTP so ES modules load as they would on a site. */
function serve() {
  const server = createServer(async (req, res) => {
    const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!path.startsWith(root)) return res.writeHead(403).end();
    try {
      res.writeHead(200, { 'content-type': types[extname(path)] || 'application/octet-stream' });
      res.end(await readFile(path));
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

if (!process.env.CHROMIUM_PATH) {
  console.error('Set CHROMIUM_PATH to a Chromium or Chrome executable.');
  process.exit(2);
}
const server = await serve();
const url = `http://127.0.0.1:${server.address().port}/index.html`;
const axe = await readFile(join(root, 'node_modules/axe-core/axe.min.js'), 'utf8');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
let failed = false;
for (const colorScheme of ['dark', 'light']) {
  const page = await browser.newPage({ colorScheme });
  await page.goto(url);
  await page.waitForFunction(() => customElements.get('prog-block'));
  await page.addScriptTag({ content: axe });
  const result = await page.evaluate(() => axe.run(document, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
  }));
  const contrast = result.passes.find((p) => p.id === 'color-contrast')?.nodes.length ?? 0;
  console.log(`${colorScheme}: ${result.passes.length} rules pass (colour contrast on ${contrast} nodes), `
    + `${result.violations.length} violations, ${result.incomplete.length} need review`);
  for (const v of [...result.violations, ...result.incomplete]) {
    console.log(`  ${v.id} [${v.impact}] ${v.nodes.map((n) => JSON.stringify(n.target)).join(', ')}`);
  }
  if (result.violations.length || result.incomplete.length) failed = true;
  await page.close();
}
await browser.close();
server.close();
process.exit(failed ? 1 : 0);
