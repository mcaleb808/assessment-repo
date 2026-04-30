import { env } from "./env";
import type { RunResponse } from "./types";

export async function runAgent(prompt: string): Promise<RunResponse> {
  const response = await fetch(`${env.apiUrl}/agent/run`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`api ${response.status}: ${detail}`);
  }
  return (await response.json()) as RunResponse;
}

export function streamUrl(prompt: string): string {
  const params = new URLSearchParams({ prompt });
  return `${env.apiUrl}/agent/stream?${params.toString()}`;
}

export async function checkHealth(): Promise<{ status: string; mcp_configured: boolean }> {
  const response = await fetch(`${env.apiUrl}/health`, { cache: "no-store" });
  if (!response.ok) throw new Error(`health ${response.status}`);
  return await response.json();
}
