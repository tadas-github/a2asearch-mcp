import { normalizeAgent } from './catalog.js';

const SETUP_HEADING = /install|setup|set.up|quick.?start|getting.started|configur|prerequis|requirement|authenticat|api.?key|credential|pricing|usage|connect|安装|配置|快速开始|环境|认证|密钥|料金|セットアップ|インストール/i;
const MAX_README = 32_000;
const MAX_EXCERPTS = 6;
const MAX_EXCERPT_CHARS = 6000;

// Keep Markdown as source data. Never execute code or fetch README links.
export function setupExcerpts(readme) {
  const sections = [];
  let section = { heading: 'README', lines: [] };
  let fence = null;
  let setupLevels = [];
  for (const line of readme.slice(0, MAX_README).split('\n')) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1];
      else if (marker[1][0] === fence[0] && marker[1].length >= fence.length) fence = null;
    }
    const heading = !fence && !marker && line.match(/^(#{1,6})\s+(.+)/);
    if (heading) {
      sections.push(section);
      const level = heading[1].length;
      setupLevels = setupLevels.filter(parent => parent < level);
      if (SETUP_HEADING.test(heading[2])) setupLevels.push(level);
      section = { heading: heading[2], lines: [], relevant: setupLevels.length > 0 };
    } else section.lines.push(line);
  }
  sections.push(section);
  let remaining = MAX_EXCERPT_CHARS;
  return sections.filter(s => s.relevant && s.lines.join('\n').trim()).slice(0, MAX_EXCERPTS).map(s => {
    const full = s.lines.join('\n').trim();
    const content = full.slice(0, remaining);
    remaining -= content.length;
    return { heading: s.heading, content, truncated: content.length < full.length };
  }).filter(s => s.content);
}

function isConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  if (value.mcpServers && typeof value.mcpServers === 'object' && !Array.isArray(value.mcpServers)) return true;
  return typeof value.command === 'string' && Array.isArray(value.args);
}

export function configurationExamples(readme) {
  const examples = [];
  // A copied example is not an endorsement or a generated installation command.
  for (const match of readme.slice(0, MAX_README).matchAll(/^\s{0,3}(`{3,}|~{3,})json\s*\n([\s\S]*?)^\s{0,3}\1\s*$/gm)) {
    if (match[2].length > 4000) continue;
    try {
      const config = JSON.parse(match[2]);
      if (isConfig(config)) examples.push({ format: 'json', content: match[2].trim() });
    } catch { /* Leave JSONC and incomplete snippets in their original excerpts. */ }
    if (examples.length === 3) break;
  }
  return examples;
}

export function buildSetup(agent, slug) {
  const summary = normalizeAgent(agent, { requestedSlug: slug });
  const readme = typeof agent.readme === 'string' ? agent.readme : '';
  const excerpts = setupExcerpts(readme);
  const examples = configurationExamples(readme);
  const sources = [{ kind: 'directory_listing', url: summary.links.listing }];
  if (readme) sources.push({ kind: 'directory_supplied_readme', url: summary.links.listing });
  for (const kind of ['repository', 'documentation', 'website']) {
    if (summary.links[kind]) sources.push({ kind, url: summary.links[kind] });
  }
  const nextSteps = [];
  if (excerpts.length || examples.length) nextSteps.push('Review the quoted setup instructions and configuration examples, including credentials and prerequisites.');
  if (summary.links.documentation) nextSteps.push(`Check the linked documentation for current setup and pricing: ${summary.links.documentation}`);
  if (summary.links.submitted_kind === 'repository') nextSteps.push('Use the repository documentation to choose a supported installation method. A repository URL is not an MCP endpoint.');
  if (summary.links.submitted_kind === 'agent_card') nextSteps.push('Inspect the submitted A2A card for its service endpoint, protocol version and authentication requirements.');
  if (summary.links.submitted_kind === 'mcp_endpoint_candidate') nextSteps.push('Confirm the submitted MCP URL, transport and authentication in the provider documentation before configuring your client.');
  if (!nextSteps.length) nextSteps.push('Open the submitted website or directory listing to find provider setup instructions.');
  return {
    agent: summary,
    setup: {
      status: excerpts.length || examples.length ? 'instructions_found' : 'links_only',
      excerpts,
      configuration_examples: examples,
      sources,
      next_steps: nextSteps,
      limitations: [
        'Instructions and examples are quoted from the directory-supplied README and have not been executed or independently verified by this tool.',
        'Pricing, authentication, hosting and last protocol-test date are not available as structured fields in the current directory API. Do not infer them from stars or directory approval.',
        'A links_only result means no supported setup excerpt was found; it does not mean the service lacks documentation.',
      ],
    },
  };
}
