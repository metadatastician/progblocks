import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const configPath = new URL('../.github/dependabot.yml', import.meta.url);
const config = Bun.YAML.parse(await readFile(configPath, 'utf8'));

describe('Dependabot pull request limits', () => {
  test('caps GitHub Actions updates at exactly two open pull requests', () => {
    const githubActionsUpdates = config.updates.filter((update) =>
      update['package-ecosystem'] === 'github-actions' && update.directory === '/'
    );

    assert.strictEqual(
      githubActionsUpdates.length,
      1,
      'expected one GitHub Actions update block for the repository root'
    );
    assert.strictEqual(
      githubActionsUpdates[0]['open-pull-requests-limit'],
      2,
      'the limit must be the number 2, not a string or a different cap'
    );
  });

  test('requires every update block to declare its own positive cap', () => {
    assert.ok(Array.isArray(config.updates) && config.updates.length > 0);

    for (const update of config.updates) {
      const label = `${update['package-ecosystem']} updates in ${update.directory}`;
      const limit = update['open-pull-requests-limit'];

      assert.ok(Object.hasOwn(update, 'open-pull-requests-limit'), `${label} must declare a cap`);
      assert.ok(Number.isInteger(limit) && limit > 0, `${label} must use a positive integer cap`);
    }
  });
});
