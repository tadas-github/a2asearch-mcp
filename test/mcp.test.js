import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const root = new URL('../', import.meta.url);
const pkg = JSON.parse(readFileSync(new URL('package.json', root), 'utf8'));

test('MCP transport, tools, validation and API errors', async t => {
  const client = new Client({ name: 'regression-test', version: '1.0.0' });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: ['--import', fileURLToPath(new URL('test/fixtures/mock-api.js', root)), fileURLToPath(new URL('index.js', root))],
    stderr: 'pipe',
  });
  t.after(() => client.close());
  await client.connect(transport);
  assert.equal(client.getServerVersion().version, pkg.version);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(tool => tool.name), ['search_agents', 'get_agent', 'list_agents']);
  assert.ok(tools[0].inputSchema.properties.type.enum.includes('AI Tool'));
  assert.equal(tools[0].inputSchema.properties.limit.maximum, 20);

  for (const [name, args, expected] of [
    ['search_agents', { query: 'playwright' }, 'Found 1 results'],
    ['get_agent', { slug: 'playwright' }, 'Fixture README'],
    ['list_agents', undefined, 'Top 1 agents by stars'],
    ['list_agents', {}, 'Top 1 agents by stars'],
    ['list_agents', { type: 'AI Tool', sort: 'new' }, 'recently added'],
  ]) {
    const result = await client.callTool({ name, ...(args === undefined ? {} : { arguments: args }) });
    assert.ok(!result.isError, JSON.stringify(result));
    assert.ok(result.content[0].text.includes(expected));
  }
  for (const [name, args] of [
    ['search_agents', {}], ['search_agents', { query: '  ' }],
    ['search_agents', { query: 12 }], ['search_agents', { query: 'test', limit: 1.5 }],
    ['search_agents', { query: 'test', limit: 0 }], ['search_agents', { query: 'test', limit: 21 }],
    ['list_agents', { type: 'invalid' }], ['list_agents', { sort: 'invalid' }],
    ['get_agent', {}], ['get_agent', { slug: '../other' }],
  ]) {
    const result = await client.callTool({ name, arguments: args });
    assert.equal(result.isError, true);
    assert.match(result.content[0].text, /Invalid arguments/);
  }
  const missing = await client.callTool({ name: 'get_agent', arguments: { slug: 'not-found' } });
  assert.equal(missing.isError, true);
  assert.match(missing.content[0].text, /not found/);
  const limited = await client.callTool({ name: 'search_agents', arguments: { query: 'rate-limit' } });
  assert.equal(limited.isError, true);
  assert.match(limited.content[0].text, /429.*retry after 30/);
});

test('package and registry manifest versions agree', () => {
  const manifest = JSON.parse(readFileSync(new URL('server.json', root), 'utf8'));
  const lock = JSON.parse(readFileSync(new URL('package-lock.json', root), 'utf8'));
  assert.equal(manifest.version, pkg.version);
  assert.equal(manifest.packages[0].version, pkg.version);
  assert.equal(lock.version, pkg.version);
  assert.deepEqual(lock.packages[''].dependencies, pkg.dependencies);
});
