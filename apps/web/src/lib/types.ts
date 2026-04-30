export type Role = "user" | "assistant";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: string | null;
  error?: string | null;
}

export interface Message {
  role: Role;
  content: string;
  toolCalls?: ToolCall[];
}

export type StreamEvent =
  | { type: "tool_call"; name: string; arguments: Record<string, unknown> }
  | { type: "tool_result"; name: string; result?: string | null; error?: string | null }
  | { type: "final"; result: string; request_id?: string | null; trace_id?: string | null };
