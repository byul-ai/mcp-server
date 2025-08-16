import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export interface ByulMcpOptions {
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.byul.ai/api/v2";

// Helper to call Byul REST API with required headers
async function callByulApi(path: string, params: Record<string, string | number | boolean | undefined> = {}, options?: ByulMcpOptions) {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  const url = new URL(path, baseUrl);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  });

  const apiKey = process.env.BYUL_API_KEY;
  if (!apiKey) {
    throw new Error("Missing BYUL_API_KEY environment variable");
  }

  const res = await fetch(url.toString(), {
    headers: {
      "X-API-Key": apiKey,
    },
  });

  const text = await res.text();
  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }

  if (!res.ok) {
    const message = json?.message ?? `HTTP ${res.status}`;
    const err = new Error(message);
    (err as any).status = res.status;
    (err as any).response = json;
    throw err;
  }

  return json;
}

export function createServer(options?: ByulMcpOptions) {
  const server = new McpServer({
    name: "@byul-ai/mcp",
    version: "0.1.0",
  });

  // Tool: news.fetch - proxy GET /news
  server.registerTool(
    "news.fetch",
    {
      title: "Fetch News",
      description: "Fetch latest financial news from Byul REST API with filters",
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional(),
        cursor: z.string().optional(),
        sinceId: z.string().optional(),
        minImportance: z.number().int().min(1).max(10).optional(),
        q: z.string().optional(),
        symbol: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      },
    },
    async (args) => {
      const data = await callByulApi("/news", {
        limit: args.limit,
        cursor: args.cursor,
        sinceId: args.sinceId,
        minImportance: args.minImportance,
        q: args.q,
        symbol: args.symbol,
        startDate: args.startDate,
        endDate: args.endDate,
      }, options);

      const items = Array.isArray(data?.items) ? data.items : [];
      const summary = `총 ${items.length}건의 기사 반환`;
      return {
        content: [
          { type: "text", text: summary },
          { type: "text", text: JSON.stringify(data) },
        ],
      };
    }
  );

  // Resource: byul://news?minImportance=... (returns summarized json)
  server.registerResource(
    "news-resource",
    new ResourceTemplate("byul://news{?limit,cursor,sinceId,minImportance,q,symbol,startDate,endDate}", { list: undefined }),
    {
      title: "Byul News Resource",
      description: "Dynamic resource to fetch news via URI parameters",
    },
    async (uri) => {
      const url = new URL(uri.href);
      const params = Object.fromEntries(url.searchParams.entries());
      const data = await callByulApi("/news", params, options);
      const items = Array.isArray(data?.items) ? data.items : [];
      const summary = `총 ${items.length}건의 기사 반환`;
      return {
        contents: [
          { uri: uri.href, text: summary },
          { uri: uri.href, text: JSON.stringify(data) },
        ],
      };
    }
  );

  return server;
}

export async function runStdio(options?: ByulMcpOptions) {
  const server = createServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}


