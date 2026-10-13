#!/usr/bin/env node
/**
 * A2ASearch MCP Server
 * Search and discover AI agents, MCP servers, CLI tools and agent skills
 * via the A2ASearch directory (https://a2asearch.ai)
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "node:fs";
import { fetchJson } from "./lib/api.js";
import { AGENT_TYPES, validateArguments } from "./lib/validation.js";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

const server = new Server(
  { name: "a2asearch", version },
  { capabilities: { tools: {} } }
);

// ── Tools ──────────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "search_agents",
      description:
        "Search the A2ASearch directory for AI agents, MCP servers, CLI tools and agent skills. " +
        "Returns name, description, type, stars, GitHub URL and capabilities for each result.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          query: {
            type: "string",
            minLength: 1,
            description: "Search query — e.g. 'database', 'browser automation', 'memory'",
          },
          type: {
            type: "string",
            enum: AGENT_TYPES,
            description: "Filter by agent type (optional)",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            description: "Number of results to return (1-20, default 10)",
            default: 10,
          },
        },
        required: ["query"],
      },
    },
    {
      name: "get_agent",
      description:
        "Get full details for a specific agent by its slug (name as kebab-case). " +
        "Returns description, README, capabilities, stars, forks, languages and more.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          slug: {
            type: "string",
            minLength: 1,
            pattern: "^[a-zA-Z0-9_-]+$",
            description: "Agent slug — e.g. 'playwright', 'ollama', 'claude-code', 'mem0'",
          },
        },
        required: ["slug"],
      },
    },
    {
      name: "list_agents",
      description:
        "List agents from A2ASearch, optionally filtered by type. " +
        "Use this to browse top agents by category.",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {
          type: {
            type: "string",
            enum: AGENT_TYPES,
            description: "Filter by type (optional — omit for all types)",
          },
          sort: {
            type: "string",
            enum: ["stars", "new"],
            description: "Sort order: 'stars' for most popular, 'new' for recently added",
            default: "stars",
          },
          limit: {
            type: "integer",
            minimum: 1,
            maximum: 20,
            description: "Number of results (1-20, default 10)",
            default: 10,
          },
        },
      },
    },
  ],
}));

// ── Tool handlers ──────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request, extra) => {
  const { name, arguments: rawArgs } = request.params;

  try {
    const args = validateArguments(name, rawArgs);
    if (name === "search_agents") {
      const { query, type, limit = 10 } = args;
      const params = new URLSearchParams({
        search: query,
        per_page: String(Math.min(20, Math.max(1, limit))),
      });
      if (type) params.set("type", type);

      const data = await fetchJson(`agents?${params}`, { signal: extra.signal });

      const results = data.data.map((a) => ({
        name: a.name,
        type: a.type,
        description: a.description,
        url: a.agentCardUrl,
        stars: a.stars,
        capabilities: a.capabilities?.slice(0, 5),
        languages: a.languages?.slice(0, 3),
        health_score: a.healthScore,
      }));

      return {
        content: [
          {
            type: "text",
            text:
              `Found ${data.pagination.total} results for "${query}"` +
              (type ? ` (type: ${type})` : "") +
              `\n\n` +
              results
                .map(
                  (r) =>
                    `**${r.name}** (${r.type})\n` +
                    `  ${r.description || "No description"}\n` +
                    `  ⭐ ${r.stars?.toLocaleString() || 0}  |  🔗 ${r.url}\n` +
                    (r.capabilities?.length
                      ? `  Capabilities: ${r.capabilities.join(", ")}\n`
                      : "")
                )
                .join("\n"),
          },
        ],
      };
    }

    if (name === "get_agent") {
      const { slug } = args;
      let a;
      try {
        ({ data: a } = await fetchJson(`agent/${encodeURIComponent(slug)}`, { signal: extra.signal }));
      } catch (error) {
        if (error.status === 404) {
          return { content: [{ type: "text", text: `Agent "${slug}" not found.` }], isError: true };
        }
        throw error;
      }

      const summary = [
        `# ${a.name}`,
        `**Type:** ${a.type}`,
        `**Description:** ${a.description || "N/A"}`,
        `**GitHub:** ${a.agentCardUrl}`,
        `**Stars:** ${a.stars?.toLocaleString() || 0}  |  **Forks:** ${a.forks || 0}`,
        a.languages?.length ? `**Languages:** ${a.languages.join(", ")}` : "",
        a.capabilities?.length
          ? `**Capabilities:** ${a.capabilities.join(", ")}`
          : "",
        a.topics?.length ? `**Topics:** ${a.topics.join(", ")}` : "",
        a.last_commit_date
          ? `**Last commit:** ${new Date(a.last_commit_date).toLocaleDateString()}`
          : "",
        "",
        a.readme
          ? `## README\n${a.readme.slice(0, 3000)}${a.readme.length > 3000 ? "\n\n_(truncated)_" : ""}`
          : "",
      ]
        .filter(Boolean)
        .join("\n");

      return { content: [{ type: "text", text: summary }] };
    }

    if (name === "list_agents") {
      const { type, sort = "stars", limit = 10 } = args;
      const params = new URLSearchParams({
        per_page: String(Math.min(20, Math.max(1, limit))),
        sort,
      });
      if (type) params.set("type", type);

      const data = await fetchJson(`agents?${params}`, { signal: extra.signal });

      const label = type ? `${type}s` : "agents";
      const sortLabel = sort === "stars" ? "by stars" : "recently added";

      return {
        content: [
          {
            type: "text",
            text:
              `Top ${data.data.length} ${label} ${sortLabel} (${data.pagination.total} total)\n\n` +
              data.data
                .map(
                  (a, i) =>
                    `${i + 1}. **${a.name}** — ${a.description?.slice(0, 80) || "No description"}\n` +
                    `   ⭐ ${a.stars?.toLocaleString() || 0}  |  ${a.agentCardUrl}`
                )
                .join("\n"),
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${name}`);
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

// ── Start ──────────────────────────────────────────────────────────────────

if (process.argv.length > 2) {
  // Preserve the documented `npx a2asearch-mcp -- <query>` CLI entry point.
  if (process.argv[2] === "--") process.argv.splice(2, 1);
  await import("./cli.js");
} else {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
