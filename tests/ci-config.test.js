import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const repositoryRoot = new URL('../', import.meta.url);
const readRepositoryFile = (path) => readFileSync(new URL(path, repositoryRoot), 'utf8');

// Parsed, not pattern-matched: the workflows are KYAML (flow style, quoted
// strings), and the earlier regexes assumed block-style YAML line by line.
const dependabotConfig = Bun.YAML.parse(readRepositoryFile('.github/dependabot.yml'));
const codeqlWorkflow = Bun.YAML.parse(readRepositoryFile('.github/workflows/codeql.yml'));
const scorecardWorkflow = Bun.YAML.parse(readRepositoryFile('.github/workflows/scorecard.yml'));
const actionsLock = readRepositoryFile('.github/workflows/actions.lock');

/** Every `uses:` reference in a parsed workflow, job-level and step-level, in file order. */
const actionReferences = (workflow) =>
  Object.values(workflow.jobs ?? {}).flatMap((job) => [
    ...(job.uses ? [job.uses] : []),
    ...(job.steps ?? []).filter((step) => step.uses).map((step) => step.uses),
  ]);

/** The single step called `name` across a parsed workflow's jobs; fails if absent. */
const namedStep = (workflow, name) => {
  const step = Object.values(workflow.jobs ?? {})
    .flatMap((job) => job.steps ?? [])
    .find((candidate) => candidate.name === name);
  assert.ok(step, `workflow should contain a named ${name} step`);
  return step;
};

const dependencyBlock = (action) => {
  const escapedAction = action.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = actionsLock.match(
    new RegExp(`^    '${escapedAction}[^']*':\\n(?:(?: {8}|\\s*$).*(?:\\n|$))+`, 'm'),
  );

  assert.ok(match, `${action} should have an entry in actions.lock`);
  return match[0];
};

const lockedCommitFor = (action) => {
  const match = dependencyBlock(action).match(/^        commit:\s*'sha1-([0-9a-f]{40})'$/m);
  assert.ok(match, `${action} should resolve to a full SHA-1 commit in actions.lock`);
  return match[1];
};

describe('pull request CI configuration', () => {
  test('caps grouped GitHub Actions updates at two open pull requests', () => {
    const githubActionsUpdate = (dependabotConfig.updates ?? []).find(
      (update) => update['package-ecosystem'] === 'github-actions',
    );

    assert.ok(githubActionsUpdate, 'Dependabot should configure the github-actions ecosystem');
    assert.strictEqual(githubActionsUpdate.directory, '/');
    assert.deepStrictEqual(githubActionsUpdate.groups?.actions?.patterns, ['*']);
    assert.strictEqual(githubActionsUpdate['open-pull-requests-limit'], 2);
  });

  test('pins every CodeQL workflow action to the version recorded in actions.lock', () => {
    const references = actionReferences(codeqlWorkflow);

    assert.deepStrictEqual(
      references.map((reference) => reference.slice(0, reference.lastIndexOf('@'))),
      ['actions/checkout', 'github/codeql-action/init', 'github/codeql-action/analyze'],
      'the test must cover every external action used by the CodeQL workflow',
    );

    for (const reference of references) {
      const separator = reference.lastIndexOf('@');
      const action = reference.slice(0, separator).replace(/\/(?:init|analyze)$/, '');
      const revision = reference.slice(separator + 1);

      assert.match(
        revision,
        /^v\d+\.\d+\.\d+$/,
        `${reference} should pin by version tag; actions.lock owns the commit`,
      );

      const block = dependencyBlock(`${action}@${revision}`);
      assert.match(
        block,
        new RegExp(`^        ref: '${revision}'$`, 'm'),
        `${reference} should agree with the repository action lockfile`,
      );
      lockedCommitFor(`${action}@${revision}`);
    }
  });

  test('does not persist checkout credentials in the CodeQL job', () => {
    const checkoutStep = namedStep(codeqlWorkflow, 'Checkout');

    assert.strictEqual(checkoutStep.with?.['persist-credentials'], false);
  });

  test('pins the Scorecard reusable workflow to the approved revision', () => {
    const references = actionReferences(scorecardWorkflow);

    assert.deepStrictEqual(references, [
      'hyperpolymath/standards/.github/workflows/scorecard-reusable.yml@7b931ef7f9dbb8d2386fc9170895708c0acae95c',
    ]);
  });
});
