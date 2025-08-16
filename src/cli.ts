#!/usr/bin/env node
import { runStdio } from "./index.js";

// Optional: support custom base URL via env var BYUL_BASE_URL
const baseUrl = process.env.BYUL_BASE_URL;

runStdio({ baseUrl }).catch((err) => {
  // Write minimal error to stderr to not break JSON-RPC stream structure
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[byul-mcp] fatal: ${msg}`);
  process.exit(1);
});


