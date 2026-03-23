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
import { z } from "zod";

const API_BASE = "https://a2asearch.ai/api/v1";

const server = new Server(
  { name: "a2asearch", version: "1.0.0" },
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
        properties: {
          query: {
            type: "string",
            description: "Search query — e.g. 'database', 'browser automation', 'memory'",
          },
          type: {
            type: "string",
            enum: ["MCP Server", "CLI Tool", "AI Coding Agent", "Agent Skill", "A2A Agent"],
            description: "Filter by agent type (optional)",
          },
          limit: {
            type: "number",
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
        properties: {
          slug: {
            type: "string",
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
        properties: {
          type: {
            type: "string",
            enum: ["MCP Server", "CLI Tool", "AI Coding Agent", "Agent Skill", "A2A Agent"],
            description: "Filter by type (optional — omit for all types)",
          },
          sort: {
            type: "string",
            enum: ["stars", "new"],
            description: "Sort order: 'stars' for most popular, 'new' for recently added",
            default: "stars",
          },
          limit: {
            type: "number",
            description: "Number of results (1-20, default 10)",
            default: 10,
          },
        },
      },
    },
  ],
}));

// ── Tool handlers ──────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "search_agents") {
      const { query, type, limit = 10 } = args;
      const params = new URLSearchParams({
        search: query,
        per_page: String(Math.min(20, Math.max(1, limit))),
      });
      if (type) params.set("type", type);

      const res = await fetch(`${API_BASE}/agents?${params}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

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
      const res = await fetch(`${API_BASE}/agent/${encodeURIComponent(slug)}`);
      if (!res.ok) {
        if (res.status === 404)
          return {
            content: [{ type: "text", text: `Agent "${slug}" not found.` }],
          };
        throw new Error(`API error: ${res.status}`);
      }
      const { data: a } = await res.json();

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

      const res = await fetch(`${API_BASE}/agents?${params}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();

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

const transport = new StdioServerTransport();
await server.connect(transport);
