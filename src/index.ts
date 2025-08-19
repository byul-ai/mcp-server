import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

export interface ByulMcpOptions {
  baseUrl?: string;
}

const DEFAULT_BASE_URL = "https://api.byul.ai/api/v2";

// Helper to call Byul REST API with required headers
async function callByulApi(path: string, params: Record<string, string | number | boolean | undefined> = {}, options?: ByulMcpOptions) {
  const baseUrl = options?.baseUrl ?? DEFAULT_BASE_URL;
  // Normalize to avoid dropping base path when path starts with "/"
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);
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
    name: "byul_mcp",
    version: "0.1.4",
  });

  // Tool: news_fetch - proxy GET /news
  server.registerTool(
    "news_fetch",
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
        category: z.string().optional(),
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
        category: (args as any).category,
        startDate: args.startDate,
        endDate: args.endDate,
      }, options);

      const items = Array.isArray(data?.items) ? data.items : [];
      // Fixed output: markdown list without header
      const markdown = items.length === 0
        ? "No articles."
        : items.map((it: any) => {
            const date = it?.date ?? "";
            const title = it?.title ?? "";
            const url = it?.url ?? "";
            return `- ${date} | ${title} | ${url}`;
          }).join("\n");

      return { content: [{ type: "text", text: markdown }] };
    }
  );

  return server;
}

export async function runStdio(options?: ByulMcpOptions) {
  const server = createServer(options);
  const transport = new StdioServerTransport();
  await server.connect(transport);
}


