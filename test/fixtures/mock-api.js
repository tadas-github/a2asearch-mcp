const agent = {
  name: 'Playwright', type: 'MCP Server', description: 'Browser automation',
  agentCardUrl: 'https://github.com/microsoft/playwright-mcp', stars: 1234,
  capabilities: ['browser'], languages: ['TypeScript'],
  contactEmail: 'not-for-export@example.org',
  readme: 'Fixture README\n\n## Installation\nBring Node.js.\n### Configuration\n```json\n{"mcpServers":{"fixture":{"command":"npx","args":["fixture-package"],"env":{"API_KEY":"YOUR_KEY"}}}}\n```\n## Authentication\nSupply your own key.',
};

globalThis.fetch = async input => {
  const url = new URL(input);
  if (url.origin !== 'https://www.a2asearch.ai') throw new Error('Unexpected API origin');
  if (url.pathname.endsWith('/not-found')) return new Response('{}', { status: 404 });
  if (url.searchParams.get('search') === 'rate-limit') return new Response('{}', { status: 429, headers: { 'retry-after': '30' } });
  if (url.searchParams.get('search') === 'undefined') throw new Error('Missing query reached the API');
  if (url.pathname.endsWith('/hosted')) return Response.json({ data: { name: 'Hosted', type: 'MCP Server', agentCardUrl: 'https://example.org/mcp', documentation: 'https://example.org/docs', reviewed: true } });
  if (url.pathname.includes('/agent/')) return Response.json({ data: agent });
  if (url.searchParams.get('search') === 'empty') return Response.json({ data: [], pagination: { total: 0, total_pages: 0, has_next: false } });
  if (url.searchParams.get('search') === 'malformed') return Response.json({ data: {} });
  if (url.pathname.endsWith('/agents')) {
    const page = Number(url.searchParams.get('page') || 1);
    const paginated = url.searchParams.get('search') === 'pages';
    return Response.json({ data: [{ ...agent, name: page === 2 ? 'Second Tool' : agent.name }], pagination: { page, total: paginated ? 2 : 1, total_pages: paginated ? 2 : 1, has_next: paginated && page === 1 } });
  }
  throw new Error(`Unexpected request: ${url}`);
};
