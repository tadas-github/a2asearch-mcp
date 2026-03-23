# A2ASearch MCP Server

Search and discover AI agents, MCP servers, CLI tools and agent skills directly from Claude, Cursor, or any MCP client — powered by the [A2ASearch](https://a2asearch.ai) directory (4,800+ entries).

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
      "args": ["-y", "github:tadas-github/a2asearch-mcp"]
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
      "args": ["-y", "github:tadas-github/a2asearch-mcp"]
    }
  }
}
```

> **npm package coming soon.** Once published, replace `github:tadas-github/a2asearch-mcp` with `@a2asearch/mcp-server`.

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
