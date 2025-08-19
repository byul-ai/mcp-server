# @byul/mcp

Compliant with the latest Model Context Protocol (MCP) specification.

## Links

- [API Documentation](https://www.byul.ai/api)
- [API Pricing](https://www.byul.ai/api/pricing)
- [Developer Documentation](https://docs.byul.ai/)
- [API Status](https://www.byul.ai/api/status)

## Overview

`@byul/mcp` is a stdio-based MCP server that proxies the Byul REST API. It exposes a small set of MCP tools and a resource that forward requests to Byul endpoints and return the original JSON response, plus a short article-count summary string.

## Requirements

- Node.js 18+
- `BYUL_API_KEY` environment variable

## Quick start

```bash
BYUL_API_KEY=byul_xxxxxxxxxxxxx npx -y @byul/mcp
```

## Configuration

Register this server as an MCP provider in your LLM client. The client will launch the server via stdio and communicate using JSON-RPC over stdin/stdout.

## Parameters

- Tools (summary; see `@docs` for the full spec)
  - `news_fetch` → proxies `GET /news` with filters: `limit`, `cursor`, `sinceId`, `minImportance`, `q`, `symbol`, `startDate`, `endDate`
- Resource (summary; see `@docs` for the full spec)
  - `byul://news{?limit,cursor,sinceId,minImportance,q,symbol,startDate,endDate}`

Each response contains:
- A summary string like “Returned N articles”
- The original JSON payload from the Byul API

## Available Tools

### `news_fetch`
- Description: Fetch latest financial news
- Parameters:
  - `limit` (number, optional) – number of articles (1-100)
  - `cursor` (string, optional) – pagination cursor from previous page
  - `sinceId` (string, optional) – return articles created after this ID
  - `minImportance` (number, optional) – minimum importance (1-10)
  - `q` (string, optional) – search query
  - `symbol` (string, optional) – stock symbol (e.g., AAPL)
  - `startDate` (string, optional) – ISO 8601 start timestamp (UTC)
  - `endDate` (string, optional) – ISO 8601 end timestamp (UTC)
- Example request:

```txt
Fetch top 5 news articles about AAPL from the past week
```


## Security

- Provide the API key via the `BYUL_API_KEY` environment variable only. Do not hardcode credentials in code or configs.

## Platform setup

### 1) Cursor (latest)

`~/.cursor/mcp.json` or project `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 2) Claude Code (VS Code extension)

#### CLI

```bash
claude mcp add -e BYUL_API_KEY=byul_xxxxxxxxxxxxx --scope user byul npx -- -y @byul/mcp
```

#### Settings JSON

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 3) Claude Desktop

#### `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 4) VS Code

#### Workspace `.vscode/mcp.json`:

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

### 5) Windsurf

#### `windsurf_mcp.json`:

```json
{
  "mcpServers": {
    "mcp-server-byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": {
        "BYUL_API_KEY": "byul_xxxxxxxxxxxxx"
      }
    }
  }
}
```

### 6) Gemini CLI

`~/.gemini/settings.json`:

```json
{
  "mcpServers": {
    "byul": {
      "command": "npx",
      "args": ["-y", "@byul/mcp"],
      "env": { "BYUL_API_KEY": "byul_xxxxxxxxxxxxx" }
    }
  }
}
```

If the `mcpServers` object does not exist, create it. This package supports stdio (local) transport only.

## Troubleshooting

- Missing API key
  - Error example: `Missing BYUL_API_KEY environment variable`
  - Fix: set `BYUL_API_KEY` in your environment before launching the server

- Corporate proxy / firewall
  - `npx` must reach the registry to download `@byul/mcp` on first run; configure your proxy settings accordingly

- Windows / WSL path and env
  - PowerShell example:
    ```powershell
    $env:BYUL_API_KEY = "byul_xxxxxxxxxxxxx"
    npx -y @byul/mcp
    ```

- Transport scope
  - This package covers only stdio transport. HTTP/SSE transports are intentionally not covered in this guide.

Compliant with the latest Model Context Protocol (MCP) specification.


