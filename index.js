#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { readFileSync } from 'node:fs';
import { fetchJson } from './lib/api.js';
import { validateArguments } from './lib/validation.js';
import { normalizeAgent, normalizePage } from './lib/catalog.js';
import { buildSetup } from './lib/setup.js';
import { tools } from './lib/tools.js';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
const server = new Server({ name: 'a2asearch', version }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

// Include serialized data for clients that do not consume structuredContent.
function result(data, summary) {
  return { content: [{ type: 'text', text: `${summary}\n\n${JSON.stringify(data)}` }], structuredContent: data };
}

server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  const { name, arguments: rawArgs } = request.params;
  try {
    const args = validateArguments(name, rawArgs);
    if (name === 'get_agent' || name === 'get_setup') {
      let agent;
      try {
        ({ data: agent } = await fetchJson(`agent/${encodeURIComponent(args.slug)}`, { signal: extra.signal }));
      } catch (error) {
        if (error.status === 404) throw new Error(`Agent "${args.slug}" not found. Use a slug returned by search_agents.`);
        throw error;
      }
      if (name === 'get_setup') {
        const data = buildSetup(agent, args.slug);
        return result(data, `Setup for ${data.agent.name}: ${data.setup.status}. Quoted source material; review before use.`);
      }
      return result({ agent: normalizeAgent(agent, { detail: true, requestedSlug: args.slug }) }, `Details for ${agent.name}`);
    }

    const params = new URLSearchParams({ per_page: String(args.limit), page: String(args.page) });
    if (args.type) params.set('type', args.type);
    if (name === 'search_agents') params.set('search', args.query);
    else params.set('sort', args.sort);
    const response = await fetchJson(`agents?${params}`, { signal: extra.signal });
    const data = normalizePage(response, args);
    const summary = name === 'search_agents'
      ? `Found ${data.pagination.total ?? data.agents.length} results for "${args.query}". Showing page ${args.page}.`
      : `Top ${data.agents.length} ${args.type || 'agents'} ${args.sort === 'new' ? 'recently added' : 'by stars'}. Page ${args.page}.`;
    const hint = data.agents.length ? ' Use the returned slug with get_agent or get_setup.' : ' Try fewer task keywords or remove the type filter.';
    return result(data, summary + hint);
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

if (process.argv.length > 2) {
  if (process.argv[2] === '--') process.argv.splice(2, 1);
  await import('./cli.js');
} else {
  await server.connect(new StdioServerTransport());
}
