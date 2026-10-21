import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeAgent, normalizePage, httpUrl } from '../lib/catalog.js';
import { buildSetup, setupExcerpts, configurationExamples } from '../lib/setup.js';

const base = { name: 'Example.Tools_Server', type: 'MCP Server', contactEmail: 'not-for-export@example.org' };

test('results expose follow-up slugs and keep source kinds distinct', () => {
  const repo = normalizeAgent({ ...base, agentCardUrl: 'https://github.com/example/tool', reviewed: true });
  assert.equal(repo.slug, 'exampletools-server');
  assert.equal(repo.links.listing, 'https://www.a2asearch.ai/agent/exampletools-server');
  assert.equal(repo.links.submitted_kind, 'repository');
  assert.equal(repo.links.repository, repo.links.submitted);
  assert.equal(repo.directory_reviewed, true);
  assert.equal('contactEmail' in repo, false);
  assert.equal('healthScore' in repo, false);
  assert.equal(normalizeAgent(base).stars, null);
  assert.equal(normalizeAgent({ ...base, stars: 0 }).stars, 0);
  assert.equal(normalizeAgent({ ...base, agentCardUrl: 'https://example.org/mcp' }).links.submitted_kind, 'mcp_endpoint_candidate');
  const a2a = normalizeAgent({ ...base, type: 'A2A Agent', agentCardUrl: 'https://example.org/.well-known/agent-card.json' });
  assert.equal(a2a.links.submitted_kind, 'agent_card');
  assert.equal(a2a.links.repository, null);
  assert.equal(normalizeAgent({ ...base, agentCardUrl: 'https://example.org/' }).links.submitted_kind, 'website');
  assert.equal(normalizeAgent({ ...base, agentCardUrl: 'https://github.com.example.org/a/b' }).links.repository, null);
});

test('unsafe links are omitted and unknown metadata stays unknown', () => {
  for (const url of ['javascript:alert(1)', 'file:///etc/passwd', 'https://user:password@example.org/mcp', 'not a url']) assert.equal(httpUrl(url), null);
  const result = normalizeAgent({ ...base, description: 'Free and verified!', healthScore: 100, submittedAt: '2026-01-01', agentCardUrl: 'javascript:alert(1)' });
  assert.equal(result.directory_reviewed, null);
  assert.equal(result.links.submitted, null);
  assert.equal(result.links.submitted_kind, 'unknown');
  assert.equal('protocol_tested_at' in result, false);
  assert.throws(() => normalizeAgent(null), /invalid agent/);
  assert.throws(() => normalizePage({ data: {} }, { page: 1, limit: 10 }), /invalid results/);
});

test('pagination preserves total and provides next call arguments', () => {
  const result = normalizePage({ data: [base], pagination: { total: 3, total_pages: 3, has_next: true } }, { page: 2, limit: 1 });
  assert.deepEqual(result.pagination, { page: 2, per_page: 1, total: 3, total_pages: 3, next_page: 3 });
  assert.equal(normalizePage({ data: [], pagination: { total: 0, has_next: false } }, { page: 1, limit: 10 }).pagination.next_page, null);
});

test('setup retains nested setup sections and skips unrelated sections and headings inside fences', () => {
  const readme = '# Tool\nIntro\n## Installation\nStart here.\n### Configuration\n```sh\n# This is a shell comment\necho hello\n```\n### Windows\nUse this on Windows.\n## Development\nDo not include development.\n## Authentication\nBring your API key.';
  const excerpts = setupExcerpts(readme);
  assert.deepEqual(excerpts.map(x => x.heading), ['Installation', 'Configuration', 'Windows', 'Authentication']);
  assert.match(excerpts[1].content, /# This is a shell comment/);
  assert.ok(!JSON.stringify(excerpts).includes('Do not include development'));
  assert.equal(setupExcerpts('## 快速开始\nRun the client.')[0].heading, '快速开始');
});

test('configuration examples are copied, never inferred from repository names', () => {
  const config = '{"mcpServers":{"fixture":{"command":"npx","args":["fixture-package"],"env":{"API_KEY":"YOUR_KEY"}}}}';
  const readme = '## Install\n```json\n' + config + '\n```\n```json\n{"name":"unrelated-package"}\n```\n```json\n{broken}\n```';
  const data = buildSetup({ ...base, agentCardUrl: 'https://github.com/example/different-name', readme }, 'example');
  assert.equal(data.setup.status, 'instructions_found');
  assert.equal(data.setup.configuration_examples.length, 1);
  assert.equal(data.setup.configuration_examples[0].content, config);
  assert.equal(data.setup.sources[1].kind, 'directory_supplied_readme');
  assert.match(data.setup.limitations[0], /not been executed or independently verified/);
  assert.equal(configurationExamples('```json\n{"command":"npx","args":["fixture"]}\n```').length, 1);
  assert.equal(configurationExamples('```json\n{"command":"npx","args":["fixture"]}').length, 0);
});

test('missing docs gives useful links without invented setup or verification', () => {
  const data = buildSetup({ ...base, agentCardUrl: 'https://example.org/mcp', documentation: 'https://example.org/docs', reviewed: true }, 'hosted');
  assert.equal(data.setup.status, 'links_only');
  assert.deepEqual(data.setup.configuration_examples, []);
  assert.deepEqual(data.setup.excerpts, []);
  assert.match(data.setup.next_steps.join(' '), /transport and authentication/);
  assert.equal(data.setup.sources.find(x => x.kind === 'documentation').url, 'https://example.org/docs');
  assert.ok(!JSON.stringify(data).includes('not-for-export@example.org'));
});

test('long readmes and setup excerpts are bounded with truncation markers', () => {
  const detail = normalizeAgent({ ...base, readme: 'a'.repeat(9000) }, { detail: true });
  assert.equal(detail.readme.length, 8000);
  assert.equal(detail.readme_truncated, true);
  const excerpts = setupExcerpts('## Setup\n' + 'a'.repeat(9000));
  assert.equal(excerpts[0].content.length, 6000);
  assert.equal(excerpts[0].truncated, true);
});
