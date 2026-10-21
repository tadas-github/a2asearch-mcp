import { AGENT_TYPES } from './validation.js';

const nullableString = { type: ['string', 'null'] };
const nullableNumber = { type: ['number', 'null'] };
const stringArray = { type: 'array', items: { type: 'string' } };
const object = properties => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false });
const agentProperties = {
  name: { type: 'string' }, slug: nullableString, type: nullableString, description: nullableString,
  links: object({
    listing: nullableString, submitted: nullableString,
    submitted_kind: { enum: ['repository', 'agent_card', 'mcp_endpoint_candidate', 'website', 'unknown'] },
    repository: nullableString, documentation: nullableString, website: nullableString,
  }),
  capabilities: stringArray, languages: stringArray, stars: nullableNumber,
  last_commit_at: nullableString, directory_reviewed: { type: ['boolean', 'null'] },
};
const agentSchema = object(agentProperties);
const paginationSchema = object({
  page: { type: 'integer' }, per_page: { type: 'integer' },
  total: nullableNumber, total_pages: nullableNumber, next_page: { type: ['integer', 'null'] },
});
const pageOutput = object({ agents: { type: 'array', items: agentSchema }, pagination: paginationSchema });
const detailOutput = object({ agent: object({
  ...agentProperties, forks: nullableNumber, topics: stringArray, readme: { type: 'string' }, readme_truncated: { type: 'boolean' },
}) });
const setupOutput = object({
  agent: agentSchema,
  setup: object({
    status: { enum: ['instructions_found', 'links_only'] },
    excerpts: { type: 'array', items: object({ heading: { type: 'string' }, content: { type: 'string' }, truncated: { type: 'boolean' } }) },
    configuration_examples: { type: 'array', items: object({ format: { const: 'json' }, content: { type: 'string' } }) },
    sources: { type: 'array', items: object({ kind: { type: 'string' }, url: nullableString }) },
    next_steps: stringArray, limitations: stringArray,
  }),
});
const type = { type: 'string', enum: AGENT_TYPES, description: 'Optional directory category.' };
const limit = { type: 'integer', minimum: 1, maximum: 20, default: 10, description: 'Results per page (1–20).' };
const page = { type: 'integer', minimum: 1, maximum: 10000, default: 1, description: 'Page number; use pagination.next_page to continue.' };
const slug = { type: 'string', minLength: 1, pattern: '^[a-zA-Z0-9_-]+$', description: 'Use the slug returned by search_agents or list_agents; do not guess from a repository name.' };
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true };
const common = ' Reads the public A2ASearch API without an API key. Does not install or invoke listed tools. Requests time out after 15 seconds; rate-limit errors include retry guidance when available.';
const input = (properties, required = []) => ({ type: 'object', properties, required, additionalProperties: false });

export const tools = [
  {
    name: 'search_agents', title: 'Find agents and tools',
    description: 'Search by task keywords, capability or product name. Returns slugs for follow-up calls, source and listing links, capabilities and popularity. Use concise keywords such as "PDF parsing"; pricing/authentication filters are not supported. Use get_setup for installation instructions.' + common,
    annotations,
    inputSchema: input({ query: { type: 'string', minLength: 1, description: 'Task keywords or product name, e.g. "browser automation", "PDF", "database".' }, type, limit, page }, ['query']),
    outputSchema: pageOutput,
  },
  {
    name: 'get_agent', title: 'Inspect an agent',
    description: 'Get one listing by its returned slug, including README, capabilities, repository/documentation links and directory approval status. Approval is not a security audit or evidence of a recent protocol test. Use get_setup for focused setup excerpts.' + common,
    annotations,
    inputSchema: input({ slug }, ['slug']),
    outputSchema: detailOutput,
  },
  {
    name: 'list_agents', title: 'Browse agents and tools',
    description: 'Browse a category by GitHub stars or newest additions, with pagination. Stars indicate popularity, not reliability or suitability. Use search_agents when you have a task in mind.' + common,
    annotations,
    inputSchema: input({ type, sort: { type: 'string', enum: ['stars', 'new'], default: 'stars', description: 'Order by GitHub stars or newest listings.' }, limit, page }),
    outputSchema: pageOutput,
  },
  {
    name: 'get_setup', title: 'Get setup instructions',
    description: 'Retrieve setup/prerequisite excerpts and JSON configuration examples from a listing’s directory-supplied README, plus documentation links and next steps. Returns links_only when no supported excerpt is available. Examples are source data, not verified commands; review credentials and prerequisites before use. Does not fetch provider endpoints or modify client configuration.' + common,
    annotations,
    inputSchema: input({ slug }, ['slug']),
    outputSchema: setupOutput,
  },
];
