# A2ASearch MCP Server

> **10,752 AI agents, MCP servers, CLI tools and agent skills** — searchable in seconds from Claude, Cursor, or any MCP client.

[![npm version](https://img.shields.io/npm/v/a2asearch-mcp)](https://www.npmjs.com/package/a2asearch-mcp)
[![npm downloads](https://img.shields.io/npm/dw/a2asearch-mcp)](https://www.npmjs.com/package/a2asearch-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![a2asearch-mcp MCP server](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp/badges/score.svg)](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp)

The only unified search engine for the AI agent ecosystem. One package. Every major MCP server, CLI tool, coding agent, and agent skill — indexed and searchable.

```bash
npx a2asearch-mcp -- playwright
# → Finds playwright MCP server, CLI tools, related agents
```

---

## Why A2ASearch?

The MCP/agent ecosystem is exploding. There are now thousands of tools across GitHub, npm, and various registries — and no single place to find them. A2ASearch indexes them all:

| What you're looking for | A2ASearch has it |
|------------------------|-----------------|
| MCP servers for Claude/Cursor | ✅ 2,000+ indexed |
| CLI tools for LLM workflows | ✅ |
| AI coding agents (Codex, Claude Code, etc.) | ✅ |
| Agent skills & plugins | ✅ |
| A2A protocol agents | ✅ |

No auth needed. No API key. Free.

---

## Installation

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

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

### Cursor

Add to `.cursor/mcp.json`:

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

### Windsurf

Add to `~/.codeium/windsurf/mcp_config.json`:

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

### Cline / Continue / OpenClaw

Same format — add to your MCP config file:

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

---

## MCP Tools

### `search_agents`
Search across the full directory by keyword.

```
"Find MCP servers for browser automation"
"Search for AI agents that can do web research"
"Find CLI tools for working with LLMs"
```

### `get_agent`
Get full details for a specific agent including README, capabilities, stars.

```
"Get details for playwright"
"Tell me about claude-code"
"Show me the mem0 agent"
```

### `list_agents`
Browse top agents by type and sort order.

```
"List the top MCP servers by stars"
"Show me the newest AI coding agents"
"What are the top agent skills?"
```

---

## Example Prompts

Once installed, ask your AI assistant:

> "Search for MCP servers that can help me work with databases"

> "What are the most popular AI coding agents right now?"

> "Find agent skills for web browsing"

> "Is there an MCP server for Notion?"

> "Get full details on the ollama agent"

---

## CLI Usage

Don't need the MCP server? Use the CLI directly:

```bash
# Install globally
npm install -g a2asearch-mcp

# Search by keyword
a2asearch playwright
a2asearch "web scraping"
a2asearch database

# Filter by type
a2asearch --type mcp database
a2asearch --type skill web-browsing
a2asearch --type cli llm
a2asearch --type agent coding

# Top agents by stars
a2asearch --type mcp --top
a2asearch --type agent --top

# Get full details
a2asearch --get ollama
a2asearch --get playwright

# Newest additions
a2asearch --new
```

Or without installing:

```bash
npx a2asearch-mcp -- playwright
npx a2asearch-mcp -- --type mcp database
npx a2asearch-mcp -- --get ollama
```

---

## Agent Types

| Type | `--type` flag | Description |
|------|--------------|-------------|
| MCP Server | `mcp` | Model Context Protocol servers |
| CLI Tool | `cli` | Terminal tools for LLM workflows |
| AI Coding Agent | `agent` | Autonomous coding agents |
| Agent Skill | `skill` | Plugins and skills for AI assistants |
| A2A Agent | `a2a` | Agent-to-Agent protocol agents |
| AI Tool | `tool` | General AI-powered tools |

---

## REST API

The MCP server wraps the free [A2ASearch REST API](https://a2asearch.ai/api-docs). Use it directly if you prefer:

```bash
# Search
curl "https://a2asearch.ai/api/v1/agents?q=playwright"

# Get by slug
curl "https://a2asearch.ai/api/v1/agent/playwright"

# List by type
curl "https://a2asearch.ai/api/v1/agents?type=MCP+Server&sort=stars"
```

No authentication required.

---

## Submit a Tool

Know a tool that's missing? **[Submit it →](https://a2asearch.ai)**

The index is community-maintained. Submissions are reviewed and added within 24–48 hours.

---

## Links

- 🌐 [a2asearch.ai](https://a2asearch.ai) — browse the full directory
- 📦 [npm](https://www.npmjs.com/package/a2asearch-mcp)
- 🐛 [Issues](https://github.com/tadas-github/a2asearch-mcp/issues)

---

## License

MIT
