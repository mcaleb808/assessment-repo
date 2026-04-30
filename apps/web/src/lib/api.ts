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

  const drain = () => {
    while (true) {
      const match = buffer.match(/\r?\n\r?\n/);
      if (!match || match.index === undefined) return;
      const block = buffer.slice(0, match.index);
      buffer = buffer.slice(match.index + match[0].length);
      const event = parseSseBlock(block);
      if (event) callbacks.onEvent(event);
    }
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    drain();
  }
  buffer += decoder.decode();
  drain();
}

function parseSseBlock(block: string): StreamEvent | null {
  let data = "";
  for (const line of block.split(/\r?\n/)) {
    if (line.startsWith("data:")) data += line.slice(5).trimStart();
  }
  if (!data) return null;
  try {
    return JSON.parse(data) as StreamEvent;
  } catch {
    return null;
  }
}
