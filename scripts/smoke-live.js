// Read-only round trip against the live directory. Checks response shapes
// rather than specific listings, so it survives catalog changes.
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({ name: 'a2asearch-live-smoke', version: '1.0.0' });
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('../index.js', import.meta.url))], stderr: 'pipe' }));
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(tool => tool.name).sort(), ['get_agent', 'get_setup', 'list_agents', 'search_agents']);

  const listed = await client.callTool({ name: 'list_agents', arguments: { type: 'MCP Server', limit: 3 } });
  assert.ok(!listed.isError, listed.content[0].text);
  assert.ok(listed.structuredContent.agents.length > 0, 'Expected at least one MCP server');

  const search = await client.callTool({ name: 'search_agents', arguments: { query: 'github', limit: 3 } });
  assert.ok(!search.isError, search.content[0].text);
  const entry = search.structuredContent.agents[0] || listed.structuredContent.agents[0];
  assert.ok(entry.slug, 'Expected a slug for follow-up calls');

  const detail = await client.callTool({ name: 'get_agent', arguments: { slug: entry.slug } });
  assert.ok(!detail.isError, detail.content[0].text);
  assert.equal(detail.structuredContent.agent.name, entry.name);

  const setup = await client.callTool({ name: 'get_setup', arguments: { slug: entry.slug } });
  assert.ok(!setup.isError, setup.content[0].text);
  assert.ok(['instructions_found', 'links_only'].includes(setup.structuredContent.setup.status));

  const degraded = [listed, search, detail].some(r => r.content[0].text.startsWith('Note:'));
  console.log(JSON.stringify({
    version: client.getServerVersion().version,
    degraded,
    listed: listed.structuredContent.agents.map(a => a.slug),
    roundtrip: entry.slug,
    setup_status: setup.structuredContent.setup.status,
  }, null, 2));
} finally {
  await client.close();
}
