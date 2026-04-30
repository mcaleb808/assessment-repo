export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
  result?: string | null;
  error?: string | null;
}

export interface RunResponse {
  result: string;
  tool_calls: ToolCall[];
  request_id?: string | null;
  trace_id?: string | null;
}

export type StreamEvent =
  | { type: "tool_call"; name: string; arguments: Record<string, unknown> }
  | { type: "tool_result"; name: string; result?: string | null; error?: string | null }
  | { type: "final"; result: string; request_id?: string | null; trace_id?: string | null };

export interface AgentRunState {
  status: "idle" | "running" | "done" | "error";
  events: StreamEvent[];
  finalResult: string | null;
  error: string | null;
  traceId: string | null;
  requestId: string | null;
}
