const agent = {
  name: 'Playwright', type: 'MCP Server', description: 'Browser automation',
  agentCardUrl: 'https://github.com/microsoft/playwright-mcp', stars: 1234,
  capabilities: ['browser'], languages: ['TypeScript'], readme: 'Fixture README',
};

globalThis.fetch = async input => {
  const url = new URL(input);
  if (url.origin !== 'https://www.a2asearch.ai') throw new Error('Unexpected API origin');
  if (url.pathname.endsWith('/not-found')) return new Response('{}', { status: 404 });
  if (url.searchParams.get('search') === 'rate-limit') return new Response('{}', { status: 429, headers: { 'retry-after': '30' } });
  if (url.searchParams.get('search') === 'undefined') throw new Error('Missing query reached the API');
  if (url.pathname.includes('/agent/')) return Response.json({ data: agent });
  if (url.pathname.endsWith('/agents')) {
    return Response.json({ data: [agent], pagination: { total: 1 } });
  }
  throw new Error(`Unexpected request: ${url}`);
};
