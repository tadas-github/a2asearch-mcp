import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('../', import.meta.url));
function run(entry, args) {
  return spawnSync(process.execPath, ['--import', './test/fixtures/mock-api.js', entry, ...args], { cwd, encoding: 'utf8', timeout: 5000 });
}

for (const entry of ['index.js', 'cli.js']) {
  test(`${entry}: search, JSON, detail and help`, () => {
    for (const args of [['playwright'], ['--', 'playwright'], ['--type', 'mcp', '--top'], ['--new'], ['--get', 'playwright'], ['--setup', 'playwright']]) {
      const result = run(entry, args);
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, /Playwright/);
    }
    const json = run(entry, ['playwright', '--json']);
    assert.equal(json.status, 0, json.stderr);
    assert.equal(JSON.parse(json.stdout).data[0].name, 'Playwright');
    const setup = run(entry, ['--setup', 'playwright', '--json']);
    assert.equal(setup.status, 0, setup.stderr);
    assert.equal(JSON.parse(setup.stdout).setup.status, 'instructions_found');
    const second = run(entry, ['pages', '--page', '2', '--json']);
    assert.equal(second.status, 0, second.stderr);
    assert.equal(JSON.parse(second.stdout).data[0].name, 'Second Tool');
    assert.match(run(entry, ['--help']).stdout, /Usage:/);
  });

  test(`${entry}: invalid arguments exit nonzero`, () => {
    for (const args of [
      ['--get'], ['--get', ''], ['--limit', 'oops', 'test'], ['--limit', '1.5', 'test'],
      ['--limit', '21', 'test'], ['--limit', '0', 'test'], ['--unknown'],
      ['--type', 'invalid', 'test'], ['--type', '', 'test'], ['--top', '--new'], ['--get', 'playwright', 'extra'],
      ['--setup'], ['--setup', ''], ['--setup', 'playwright', '--get', 'playwright'],
      ['--setup', 'playwright', '--page', '2'], ['--page', '0', 'test'], ['--page', '1.5', 'test'],
    ]) {
      const result = run(entry, args);
      assert.equal(result.status, 1, `${args}: ${result.stdout} ${result.stderr}`);
      assert.match(result.stderr, /Error:/);
    }
  });
}
