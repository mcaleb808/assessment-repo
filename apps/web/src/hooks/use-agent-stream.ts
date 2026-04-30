"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { streamUrl } from "@/lib/api";
import type { AgentRunState, StreamEvent } from "@/lib/types";

const initialState: AgentRunState = {
  status: "idle",
  events: [],
  finalResult: null,
  error: null,
  traceId: null,
  requestId: null,
};

export function useAgentStream() {
  const [state, setState] = useState<AgentRunState>(initialState);
  const sourceRef = useRef<EventSource | null>(null);

  const stop = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      sourceRef.current?.close();
      sourceRef.current = null;
    };
  }, []);

  const reset = useCallback(() => {
    stop();
    setState(initialState);
  }, [stop]);

  const start = useCallback(
    (prompt: string) => {
      stop();
      setState({ ...initialState, status: "running" });
      const source = new EventSource(streamUrl(prompt));
      sourceRef.current = source;

      const onAny = (rawType: StreamEvent["type"]) => (event: MessageEvent<string>) => {
        try {
          const payload = JSON.parse(event.data) as StreamEvent;
          setState((prev) => {
            const next: AgentRunState = { ...prev, events: [...prev.events, payload] };
            if (payload.type === "final") {
              next.status = "done";
              next.finalResult = payload.result;
              next.traceId = payload.trace_id ?? null;
              next.requestId = payload.request_id ?? null;
              source.close();
              sourceRef.current = null;
            }
            return next;
          });
        } catch (err) {
          setState((prev) => ({ ...prev, status: "error", error: `parse ${rawType}: ${String(err)}` }));
          source.close();
          sourceRef.current = null;
        }
      };

      source.addEventListener("tool_call", onAny("tool_call"));
      source.addEventListener("tool_result", onAny("tool_result"));
      source.addEventListener("final", onAny("final"));

      source.onerror = () => {
        setState((prev) =>
          prev.status === "done" ? prev : { ...prev, status: "error", error: "stream error" },
        );
        source.close();
        sourceRef.current = null;
      };
    },
    [stop],
  );

  return { state, start, stop, reset };
}
