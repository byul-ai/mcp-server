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
    name: "@byul-ai/mcp",
    version: "0.1.2",
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
        category: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        // Output formatting preference
        format: z.enum(["json", "markdown", "text"]).optional(),
        // Whether to include a header line like "# News (N)" / "News (N)"
        includeHeader: z.boolean().optional(),
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
      const summary = `Returned ${items.length} article(s)`;

      // Build response content based on preferred format
      const format = (args as any).format as undefined | "json" | "markdown" | "text";

      const includeHeader = Boolean((args as any).includeHeader);

      const buildMarkdown = (list: any[]): string => {
        if (list.length === 0) {
          return includeHeader ? `# News (0)\n\nNo articles.` : `No articles.`;
        }
        const lines = list.map((it) => {
          const date = it?.date ?? "";
          const title = it?.title ?? "";
          const url = it?.url ?? "";
          return `- ${date} | ${title} | ${url}`;
        });
        return includeHeader ? [`# News (${list.length})`, "", ...lines].join("\n") : lines.join("\n");
      };

      const buildText = (list: any[]): string => {
        if (list.length === 0) {
          return includeHeader ? `News (0)\nNo articles.` : `No articles.`;
        }
        const lines = list.map((it) => {
          const date = it?.date ?? "";
          const title = it?.title ?? "";
          const url = it?.url ?? "";
          return `${date} | ${title} | ${url}`;
        });
        return includeHeader ? [`News (${list.length})`, ...lines].join("\n") : lines.join("\n");
      };

      if (format === "json") {
        return {
          content: [{ type: "text", text: JSON.stringify(data) }],
        };
      }

      if (format === "markdown") {
        return {
          content: [{ type: "text", text: buildMarkdown(items) }],
        };
      }

      if (format === "text") {
        return {
          content: [{ type: "text", text: buildText(items) }],
        };
      }

      // Default: keep previous behavior (summary + JSON)
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
      const format = (params as any).format as undefined | "json" | "markdown" | "text";
      const includeHeader = Boolean((params as any).includeHeader);
      // Strip non-API params before calling REST API
      const { format: _f, includeHeader: _h, ...filteredParams } = params as Record<string, string>;
      const data = await callByulApi("/news", filteredParams, options);
      const items = Array.isArray(data?.items) ? data.items : [];
      const summary = `Returned ${items.length} article(s)`;

      const buildMarkdown = (list: any[]): string => {
        if (list.length === 0) {
          return includeHeader ? `# News (0)\n\nNo articles.` : `No articles.`;
        }
        const lines = list.map((it) => {
          const date = it?.date ?? "";
          const title = it?.title ?? "";
          const urlStr = it?.url ?? "";
          return `- ${date} | ${title} | ${urlStr}`;
        });
        return includeHeader ? [`# News (${list.length})`, "", ...lines].join("\n") : lines.join("\n");
      };

      const buildText = (list: any[]): string => {
        if (list.length === 0) {
          return includeHeader ? `News (0)\nNo articles.` : `No articles.`;
        }
        const lines = list.map((it) => {
          const date = it?.date ?? "";
          const title = it?.title ?? "";
          const urlStr = it?.url ?? "";
          return `${date} | ${title} | ${urlStr}`;
        });
        return includeHeader ? [`News (${list.length})`, ...lines].join("\n") : lines.join("\n");
      };

      if (format === "json") {
        return {
          contents: [{ uri: uri.href, text: JSON.stringify(data) }],
        };
      }

      if (format === "markdown") {
        return {
          contents: [{ uri: uri.href, text: buildMarkdown(items) }],
        };
      }

      if (format === "text") {
        return {
          contents: [{ uri: uri.href, text: buildText(items) }],
        };
      }

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


