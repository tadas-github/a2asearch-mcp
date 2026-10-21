# A2ASearch MCP

**Help your assistant find a tool, inspect it, and understand how to set it up.**

Search the [A2ASearch directory](https://www.a2asearch.ai) for MCP servers, A2A agents, coding agents, CLI tools and agent skills from your MCP client or terminal. A2ASearch is free to query and requires no API key. Individual services may require credentials or payment.

[![npm version](https://img.shields.io/npm/v/a2asearch-mcp)](https://www.npmjs.com/package/a2asearch-mcp)
[![CI](https://github.com/tadas-github/a2asearch-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/tadas-github/a2asearch-mcp/actions/workflows/ci.yml)
[![npm downloads](https://img.shields.io/npm/dw/a2asearch-mcp)](https://www.npmjs.com/package/a2asearch-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Glama](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp/badges/score.svg)](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp)

## Try a useful workflow

Ask your assistant:

> Find MCP servers for extracting tables from PDFs. Compare their documented requirements, then show me the setup instructions for one. Tell me when pricing or authentication is unknown.

The assistant can follow this sequence:

```text
search_agents({"query":"PDF","type":"MCP Server","limit":3})
    → names, capabilities, source links and slugs
get_agent({"slug":"<slug returned by search>"})
    → description, README, documentation and repository links
get_setup({"slug":"<same returned slug>"})
    → setup excerpts, quoted JSON examples and next steps
```

For example, the [Doc2X MCP listing](https://www.a2asearch.ai/agent/doc2x-mcp) links to a repository whose README contains setup instructions and a configuration example with a `DOC2X_API_KEY` placeholder. `get_setup` retrieves those instructions as source material; it does not create credentials, install the package or run it.

## Install

Requires **Node.js 22 or newer**. CI tests Node.js 22 and 24.

For Claude Desktop, add this entry to `claude_desktop_config.json`. For Cursor, use `.cursor/mcp.json`. Merge it with your existing configuration:

```json
{
  "mcpServers": {
    "a2asearch": {
      "command": "npx",
      "args": ["-y", "a2asearch-mcp"]
    }
  }
}
```

Other clients that support local stdio MCP servers can launch command `npx` with arguments `-y a2asearch-mcp`; use the configuration format documented by your client.

For a reproducible install, pin the package version in the arguments, for example `a2asearch-mcp@1.2.0` after that release is published. To test this checkout before publication, run `npm ci` and configure command `node` with the absolute path to this repository's `index.js`.

## Tools

| Tool | Use it for | Arguments |
| --- | --- | --- |
| `search_agents` | Find a capability or product | `query`, optional `type`, `limit`, `page` |
| `get_agent` | Inspect one listing and its README | `slug` returned by search or browse |
| `get_setup` | Read focused setup instructions and configuration examples | `slug` returned by search or browse |
| `list_agents` | Browse by stars or newest additions | Optional `type`, `sort`, `limit`, `page` |

`limit` is 1–20 (default 10), `page` starts at 1, and `sort` is `stars` or `new`. Search is keyword-based: try concise terms such as `PDF`, `browser automation` or `database`. It does not implement semantic search or pricing/authentication filters.

Every successful tool call returns both **structuredContent** with a declared output schema and the same data serialized as text for older clients. Search and browse results include:

- A `slug` for follow-up calls and an A2ASearch listing URL.
- Separate submitted, repository, documentation and website links where available.
- Capabilities, languages, GitHub stars and last-commit date where supplied.
- Pagination with `next_page` so clients can continue without guessing.

Missing values are `null`. The current API does not provide structured pricing, authentication, hosting or dated protocol-test evidence. `directory_reviewed` records directory approval only. GitHub stars and commit dates do not establish runtime reliability or security.

### Setup information

`get_setup` reads the listing's directory-supplied README and returns:

- `instructions_found` when it finds supported setup headings or JSON configuration examples.
- `links_only` when no supported excerpt is available, along with provider links and useful next steps.
- Source links, bounded excerpts and explicit limitations.

Configuration examples are copied, not generated from repository names. A GitHub repository URL is identified as a repository. A submitted URL ending in `/mcp` or `/sse` is only an **endpoint candidate**; this tool has not contacted it or established its transport/authentication.

Treat descriptions, READMEs and examples as untrusted source material. Review commands and credentials before using them. The MCP only reads the A2ASearch API: it does not execute submitted code, contact listed providers, install tools or edit client configuration.

## Terminal usage

```bash
# Find tools without installing globally
npx -y -p a2asearch-mcp a2asearch --type mcp PDF

# Use the returned slug for setup guidance (v1.2.0+)
npx -y -p a2asearch-mcp a2asearch --setup doc2x-mcp

# Or install the CLI
npm install -g a2asearch-mcp

a2asearch "browser automation"
a2asearch --type mcp database --page 2
a2asearch --type agent --top
a2asearch --new --limit 5
a2asearch --get doc2x-mcp
a2asearch --setup doc2x-mcp --json
```

`--json` preserves the existing raw directory API output for search/list/detail commands. The new `--setup --json` command returns the same setup object as the MCP tool. Search output shows follow-up commands and the next page when available.

| Directory type | CLI alias |
| --- | --- |
| MCP Server | `mcp` |
| CLI Tool | `cli` |
| AI Coding Agent | `agent` |
| Agent Skill | `skill` |
| A2A Agent | `a2a` |
| AI Tool | `tool` |

## Troubleshooting

- **No matches:** use fewer keywords or remove the category filter.
- **Listing not found:** copy the returned slug instead of guessing from a GitHub repository name.
- **No setup excerpts:** open the returned documentation or repository links; the README may use unsupported headings or be unavailable.
- **HTTP 429:** wait for the retry interval reported by the API, when supplied.
- **Timeout:** requests stop after 15 seconds and respect client cancellation. Retry later.

## API and contributions

The MCP wraps the public [A2ASearch REST API](https://www.a2asearch.ai/api-docs). [Submit a listing](https://www.a2asearch.ai), [report an issue](https://github.com/tadas-github/a2asearch-mcp/issues), or contribute improvements to setup extraction and client examples. Please include a public source and expected result for parser changes.

## Development

```bash
npm ci --ignore-scripts
npm run check
npm test
npm pack --dry-run

# Optional: read-only smoke test against the live directory
npm run smoke:live
```

Tests exercise the MCP stdio handshake, output schemas, search → detail → setup, pagination, URL classification, setup extraction, missing information, argument validation, API failures, cancellation and both CLI entry points. Normal tests use fixtures and do not contact providers.

MIT licensed. See [LICENSE](LICENSE).
