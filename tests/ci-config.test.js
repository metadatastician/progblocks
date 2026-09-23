import { describe, test } from 'bun:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const repositoryRoot = new URL('../', import.meta.url);
const readRepositoryFile = (path) => readFileSync(new URL(path, repositoryRoot), 'utf8');

const dependabotConfig = readRepositoryFile('.github/dependabot.yml');
const codeqlWorkflow = readRepositoryFile('.github/workflows/codeql.yml');
const scorecardWorkflow = readRepositoryFile('.github/workflows/scorecard.yml');
const actionsLock = readRepositoryFile('.github/workflows/actions.lock');

const actionReferences = (workflow) =>
  [...workflow.matchAll(/^\s+uses:\s+([^\s#]+)(?:\s+#.*)?$/gm)].map((match) => match[1]);

const namedStep = (workflow, name) => {
  const lines = workflow.split('\n');
  const start = lines.indexOf(`      - name: ${name}`);
  assert.notStrictEqual(start, -1, `workflow should contain a named ${name} step`);

  const nextStep = lines.findIndex((line, index) => index > start && line.startsWith('      - name:'));
  return lines.slice(start, nextStep === -1 ? undefined : nextStep).join('\n');
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
    const githubActionsUpdate = dependabotConfig.match(
      /^  - package-ecosystem:\s*["']github-actions["']\n(?:(?!^  - package-ecosystem:)[\s\S])*$/m,
    );

    assert.ok(githubActionsUpdate, 'Dependabot should configure the github-actions ecosystem');
    assert.match(githubActionsUpdate[0], /^    directory:\s*["']\/["']$/m);
    assert.match(githubActionsUpdate[0], /^    groups:\n      actions:\n        patterns:\n          - ["']\*["']$/m);
    assert.match(githubActionsUpdate[0], /^    open-pull-requests-limit:\s*2$/m);
  });

  test('pins every CodeQL workflow action to the commit recorded in actions.lock', () => {
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

      assert.match(revision, /^[0-9a-f]{40}$/, `${reference} should use an immutable commit SHA`);
      assert.strictEqual(
        revision,
        lockedCommitFor(action),
        `${reference} should agree with the repository action lockfile`,
      );
    }
  });

  test('does not persist checkout credentials in the CodeQL job', () => {
    const checkoutStep = namedStep(codeqlWorkflow, 'Checkout');

    assert.match(checkoutStep, /^        with:\n          persist-credentials:\s*false$/m);
    assert.doesNotMatch(checkoutStep, /persist-credentials:\s*["']?true["']?/);
  });

  test('pins the Scorecard reusable workflow to the approved revision', () => {
    const references = actionReferences(scorecardWorkflow);

    assert.deepStrictEqual(references, [
      'hyperpolymath/standards/.github/workflows/scorecard-reusable.yml@8750b94ac1bbe8c51ad13fe106669b13478f0b62',
    ]);
  });
});
