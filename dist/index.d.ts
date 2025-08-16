import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export interface ByulMcpOptions {
    baseUrl?: string;
}
export declare function createServer(options?: ByulMcpOptions): McpServer;
export declare function runStdio(options?: ByulMcpOptions): Promise<void>;
