import { z } from 'zod';

export const AGENT_TYPES = ['MCP Server', 'CLI Tool', 'AI Coding Agent', 'Agent Skill', 'A2A Agent', 'AI Tool'];
const type = z.enum(AGENT_TYPES).optional();
const limit = z.number().int().min(1).max(20).default(10);

export const toolSchemas = {
  search_agents: z.object({ query: z.string().trim().min(1), type, limit }).strict(),
  get_agent: z.object({ slug: z.string().trim().min(1).regex(/^[a-zA-Z0-9_-]+$/, 'Use an agent slug, not a URL') }).strict(),
  list_agents: z.object({ type, sort: z.enum(['stars', 'new']).default('stars'), limit }).strict(),
};

export function validateArguments(name, args) {
  const schema = toolSchemas[name];
  if (!schema) throw new Error(`Unknown tool: ${name}`);
  const parsed = schema.safeParse(args ?? {});
  if (!parsed.success) {
    throw new Error(`Invalid arguments: ${parsed.error.issues.map(issue => `${issue.path.join('.') || 'arguments'}: ${issue.message}`).join('; ')}`);
  }
  return parsed.data;
}
