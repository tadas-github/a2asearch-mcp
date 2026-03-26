#!/usr/bin/env node
/**
 * A2ASearch CLI
 * Search AI agents, MCP servers, CLI tools and agent skills from your terminal
 */

const API = 'https://www.a2asearch.ai/api/v1';
const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const CYAN = '\x1b[36m';
const YELLOW = '\x1b[33m';
const GREEN = '\x1b[32m';
const PURPLE = '\x1b[35m';
const BLUE = '\x1b[34m';
const RED = '\x1b[31m';

const TYPE_COLORS = {
  'MCP Server': YELLOW,
  'CLI Tool': GREEN,
  'AI Coding Agent': PURPLE,
  'Agent Skill': CYAN,
  'A2A Agent': BLUE,
};

function formatStars(n) {
  if (!n) return '';
  if (n >= 1000) return `⭐ ${(n / 1000).toFixed(0)}k`;
  return `⭐ ${n}`;
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len - 1) + '…' : str;
}

function typeLabel(type) {
  const color = TYPE_COLORS[type] || DIM;
  return `${color}${type}${RESET}`;
}

function printHelp() {
  console.log(`
${BOLD}a2asearch${RESET} — Search AI agents, MCP servers, CLI tools and agent skills

${BOLD}Usage:${RESET}
  a2asearch <query>                     Search by keyword
  a2asearch --type mcp <query>          Filter by type
  a2asearch --top [--type <type>]       Show top by stars
  a2asearch --new                       Show newest additions
  a2asearch --get <slug>                Get full details for an agent

${BOLD}Types:${RESET}
  mcp, cli, agent, skill, a2a

${BOLD}Options:${RESET}
  --limit <n>     Number of results (default: 10)
  --json          Output raw JSON
  --help          Show this help

${BOLD}Examples:${RESET}
  a2asearch playwright
  a2asearch --type mcp database
  a2asearch --type cli --top
  a2asearch --get ollama
  a2asearch --new --limit 5
`);
}

const TYPE_MAP = {
  mcp: 'MCP Server',
  cli: 'CLI Tool',
  agent: 'AI Coding Agent',
  skill: 'Agent Skill',
  a2a: 'A2A Agent',
  tool: 'AI Tool',
};

async function fetch_json(url) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text.slice(0, 100)}`);
  }
  return res.json();
}

async function search(query, { type, limit, sort } = {}) {
  const params = new URLSearchParams({ per_page: String(limit || 10) });
  if (query) params.set('search', query);
  if (type) params.set('type', type);
  if (sort) params.set('sort', sort);
  return fetch_json(`${API}/agents?${params}`);
}

async function getAgent(slug) {
  return fetch_json(`${API}/agent/${encodeURIComponent(slug)}`);
}

function printResults(data) {
  let { agents, pagination } = data.data !== undefined
    ? { agents: data.data, pagination: data.pagination }
    : { agents: data.agents || [], pagination: data.pagination };
  // Deduplicate by URL
  const seen = new Set();
  agents = agents.filter(a => {
    if (seen.has(a.agentCardUrl)) return false;
    seen.add(a.agentCardUrl);
    return true;
  });

  if (!agents || agents.length === 0) {
    console.log(`${DIM}No results found.${RESET}`);
    return;
  }

  console.log(`${DIM}Showing ${agents.length} of ${pagination?.total || agents.length} results${RESET}\n`);

  agents.forEach((a, i) => {
    const stars = formatStars(a.stars);
    const type = typeLabel(a.type || 'Unknown');
    console.log(`${BOLD}${i + 1}. ${a.name}${RESET} ${type} ${stars ? DIM + stars + RESET : ''}`);
    if (a.description) console.log(`   ${DIM}${truncate(a.description, 90)}${RESET}`);
    if (a.agentCardUrl) console.log(`   ${CYAN}${a.agentCardUrl}${RESET}`);
    console.log();
  });
}

function printAgent(data) {
  const a = data.data || data;
  console.log(`\n${BOLD}${a.name}${RESET} ${typeLabel(a.type)}`);
  console.log(`${'─'.repeat(50)}`);
  if (a.description) console.log(`\n${a.description}\n`);
  if (a.agentCardUrl) console.log(`${BOLD}GitHub:${RESET}     ${CYAN}${a.agentCardUrl}${RESET}`);
  if (a.stars) console.log(`${BOLD}Stars:${RESET}      ⭐ ${a.stars.toLocaleString()}`);
  if (a.forks) console.log(`${BOLD}Forks:${RESET}      🍴 ${a.forks.toLocaleString()}`);
  if (a.languages?.length) console.log(`${BOLD}Languages:${RESET}  ${a.languages.join(', ')}`);
  if (a.capabilities?.length) console.log(`${BOLD}Capabilities:${RESET} ${a.capabilities.join(', ')}`);
  if (a.last_commit_date) console.log(`${BOLD}Last commit:${RESET} ${new Date(a.last_commit_date).toLocaleDateString()}`);
  if (a.readme) {
    console.log(`\n${BOLD}README${RESET}\n${'─'.repeat(50)}`);
    console.log(a.readme.slice(0, 2000) + (a.readme.length > 2000 ? '\n…(truncated)' : ''));
  }
  console.log();
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const jsonOutput = args.includes('--json');
  const isTop = args.includes('--top');
  const isNew = args.includes('--new');
  const getIdx = args.indexOf('--get');
  const getSlug = getIdx !== -1 ? args[getIdx + 1] : undefined;
  const typeIdx = args.indexOf('--type');
  const typeArg = typeIdx !== -1 ? args[typeIdx + 1] : undefined;
  const limitIdx = args.indexOf('--limit');
  const limitArg = limitIdx !== -1 ? args[limitIdx + 1] : undefined;
  const limit = limitArg ? parseInt(limitArg) : 10;
  const type = typeArg ? (TYPE_MAP[typeArg.toLowerCase()] || typeArg) : undefined;

  // Remaining args = search query (skip flags and their values)
  const flags = new Set(['--type', '--limit', '--top', '--new', '--get', '--json', '--help', '-h']);
  const filteredArgs = [];
  let skipNext = false;
  for (const a of args) {
    if (skipNext) { skipNext = false; continue; }
    if (flags.has(a)) {
      if (a === '--type' || a === '--limit' || a === '--get') skipNext = true;
      continue;
    }
    filteredArgs.push(a);
  }
  const query = filteredArgs.join(' ');

  try {
    if (getSlug) {
      const data = await getAgent(getSlug);
      if (jsonOutput) { console.log(JSON.stringify(data, null, 2)); return; }
      printAgent(data);
    } else if (isTop) {
      const data = await search(query, { type, limit, sort: 'stars' });
      if (jsonOutput) { console.log(JSON.stringify(data, null, 2)); return; }
      printResults(data);
    } else if (isNew) {
      const data = await search(query, { type, limit, sort: 'new' });
      if (jsonOutput) { console.log(JSON.stringify(data, null, 2)); return; }
      printResults(data);
    } else if (query || type) {
      const data = await search(query, { type, limit });
      if (jsonOutput) { console.log(JSON.stringify(data, null, 2)); return; }
      printResults(data);
    } else {
      printHelp();
    }
  } catch (err) {
    console.error(`${RED}Error: ${err.message}${RESET}`);
    process.exit(1);
  }
}

main();
