# A2ASearch MCP Server

Search and discover AI agents, MCP servers, CLI tools and agent skills directly from Claude, Cursor, or any MCP client — powered by the [A2ASearch](https://a2asearch.ai) directory (4,800+ entries).

[![a2asearch-mcp MCP server](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp/badges/card.svg)](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp)
[![a2asearch-mcp MCP server](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp/badges/score.svg)](https://glama.ai/mcp/servers/tadas-github/a2asearch-mcp)

## Tools

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



### Cline / Continue

Same format as above — add to your MCP config file.

## Example usage

Once installed, ask Claude:

> "Search for MCP servers that can help me work with databases"

> "What are the most popular AI coding agents?"

> "Find agent skills for web browsing"

> "Get full details on the ollama agent"

## API

The MCP server wraps the free [A2ASearch REST API](https://a2asearch.ai/api-docs). No authentication needed.

## License

MIT

## CLI Usage

Search from your terminal:

```bash
# Install globally
npm install -g a2asearch-mcp

# Search by keyword
a2asearch playwright

# Filter by type
a2asearch --type mcp database

# Top AI coding agents by stars
a2asearch --type agent --top

# Get full details
a2asearch --get ollama

# Newest additions
a2asearch --new
```

Or use without installing:

```bash
npx a2asearch-mcp -- playwright
npx a2asearch-mcp -- --type mcp database
npx a2asearch-mcp -- --get ollama
```
