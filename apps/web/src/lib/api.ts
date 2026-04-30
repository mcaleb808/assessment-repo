import { env } from "./env";
import type { Message, StreamEvent } from "./types";

export async function checkHealth(): Promise<{ status: string; mcp_configured: boolean }> {
  const response = await fetch(`${env.apiUrl}/health`, { cache: "no-store" });
  if (!response.ok) throw new Error(`health ${response.status}`);
  return await response.json();
}

interface StreamCallbacks {
  onEvent: (event: StreamEvent) => void;
}

export async function streamChat(
  messages: Message[],
  callbacks: StreamCallbacks,
  signal: AbortSignal,
): Promise<void> {
  const body = JSON.stringify({
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });

  const response = await fetch(`${env.apiUrl}/agent/stream`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "text/event-stream" },
    body,
    signal,
  });

  if (!response.ok || !response.body) {
    const detail = response.body ? await response.text() : "";
    throw new Error(`stream ${response.status}${detail ? `: ${detail}` : ""}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      const block = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      const event = parseSseBlock(block);
      if (event) callbacks.onEvent(event);
      separator = buffer.indexOf("\n\n");
    }
  }
}

function parseSseBlock(block: string): StreamEvent | null {
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("data:")) data += line.slice(5).trimStart();
  }
  if (!data) return null;
  try {
    return JSON.parse(data) as StreamEvent;
  } catch {
    return null;
  }
}
