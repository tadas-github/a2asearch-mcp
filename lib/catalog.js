export const SITE = 'https://www.a2asearch.ai';

export function httpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

function repositoryUrl(value) {
  const url = httpUrl(value);
  if (!url) return null;
  const parsed = new URL(url);
  return parsed.hostname === 'github.com' && /^\/[^/]+\/[^/]+/.test(parsed.pathname) ? url : null;
}

export function slugify(name) {
  return typeof name === 'string' ? name.toLowerCase().replace(/[\s_]+/g, '-').replace(/[^a-z0-9-]/g, '') : '';
}

const strings = value => Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
const text = value => typeof value === 'string' ? value : null;
const count = value => Number.isFinite(value) && value >= 0 ? value : null;

// The API currently uses agentCardUrl for repositories, websites AND endpoints.
// Classify the URL shape, without claiming that an endpoint has been tested.
export function normalizeAgent(agent, { detail = false, requestedSlug } = {}) {
  if (!agent || typeof agent !== 'object' || typeof agent.name !== 'string') {
    throw new Error('Directory returned an invalid agent record');
  }
  const slug = requestedSlug || (/^[a-z0-9-]+$/.test(agent.slug || '') ? agent.slug : slugify(agent.name)) || null;
  const submitted = httpUrl(agent.agentCardUrl);
  const repository = repositoryUrl(agent.github) || repositoryUrl(submitted);
  let linkKind = 'unknown';
  if (submitted) {
    const path = new URL(submitted).pathname;
    if (repositoryUrl(submitted)) linkKind = 'repository';
    else if (agent.type === 'A2A Agent' && /\/(agent-card|agent)\.json$/i.test(path)) linkKind = 'agent_card';
    else if (agent.type === 'MCP Server' && /\/(mcp|sse)\/?$/i.test(path)) linkKind = 'mcp_endpoint_candidate';
    else linkKind = 'website';
  }
  const result = {
    name: agent.name,
    slug,
    type: text(agent.type),
    description: text(agent.description),
    links: {
      listing: slug ? `${SITE}/agent/${slug}` : null,
      submitted,
      submitted_kind: linkKind,
      repository,
      documentation: httpUrl(agent.documentation),
      website: httpUrl(agent.website),
    },
    capabilities: strings(agent.capabilities),
    languages: strings(agent.languages),
    stars: count(agent.stars),
    last_commit_at: text(agent.last_commit_date),
    directory_reviewed: typeof agent.reviewed === 'boolean' ? agent.reviewed : null,
  };
  if (detail) {
    result.forks = count(agent.forks);
    result.topics = strings(agent.topics);
    const readme = text(agent.readme) || '';
    result.readme = readme.slice(0, 8000);
    result.readme_truncated = readme.length > 8000;
  }
  return result;
}

export function normalizePage(response, { page, limit }) {
  if (!Array.isArray(response?.data)) throw new Error('Directory returned an invalid results page');
  const upstream = response.pagination || {};
  return {
    agents: response.data.map(agent => normalizeAgent(agent)),
    pagination: {
      page,
      per_page: limit,
      total: count(upstream.total),
      total_pages: count(upstream.total_pages),
      next_page: upstream.has_next === true ? page + 1 : null,
    },
  };
}
