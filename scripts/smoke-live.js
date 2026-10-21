import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const client = new Client({ name: 'a2asearch-live-smoke', version: '1.0.0' });
try {
  await client.connect(new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL('../index.js', import.meta.url))], stderr: 'pipe' }));
  const { tools } = await client.listTools();
  assert.ok(tools.some(tool => tool.name === 'get_setup'));
  const search = await client.callTool({ name: 'search_agents', arguments: { query: 'doc2x', type: 'MCP Server', limit: 3 } });
  assert.ok(!search.isError, search.content[0].text);
  const entry = search.structuredContent.agents.find(agent => agent.slug === 'doc2x-mcp');
  assert.ok(entry, 'Expected the public Doc2X MCP listing');
  const detail = await client.callTool({ name: 'get_agent', arguments: { slug: entry.slug } });
  assert.ok(!detail.isError, detail.content[0].text);
  assert.equal(detail.structuredContent.agent.name, entry.name);
  const setup = await client.callTool({ name: 'get_setup', arguments: { slug: entry.slug } });
  assert.ok(!setup.isError, setup.content[0].text);
  assert.equal(setup.structuredContent.setup.status, 'instructions_found');
  assert.ok(setup.structuredContent.setup.configuration_examples.length > 0);
  const hosted = await client.callTool({ name: 'get_setup', arguments: { slug: 'carejobsnow' } });
  assert.ok(!hosted.isError, hosted.content[0].text);
  assert.equal(hosted.structuredContent.agent.links.repository, null);
  assert.equal(hosted.structuredContent.agent.links.submitted_kind, 'mcp_endpoint_candidate');
  console.log(JSON.stringify({ version: client.getServerVersion().version, tools: tools.map(tool => tool.name), roundtrip: entry.slug, setup_excerpts: setup.structuredContent.setup.excerpts.length, configuration_examples: setup.structuredContent.setup.configuration_examples.length, hosted_source_kind: hosted.structuredContent.agent.links.submitted_kind }, null, 2));
} finally {
  await client.close();
}
