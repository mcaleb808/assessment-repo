"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { streamChat } from "@/lib/api";
import type { Message, ToolCall } from "@/lib/types";

interface ChatState {
  messages: Message[];
  pendingToolCalls: ToolCall[];
  isStreaming: boolean;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  pendingToolCalls: [],
  isStreaming: false,
  error: null,
};

export function useChat() {
  const [state, setState] = useState<ChatState>(initialState);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(
    () => () => {
      abortRef.current?.abort();
      abortRef.current = null;
    },
    [],
  );

  const send = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed || state.isStreaming) return;

      const userMessage: Message = { role: "user", content: trimmed };
      const history = [...state.messages, userMessage];

      setState({
        messages: history,
        pendingToolCalls: [],
        isStreaming: true,
        error: null,
      });

      const calls: ToolCall[] = [];
      const controller = new AbortController();
      abortRef.current?.abort();
      abortRef.current = controller;

      try {
        await streamChat(
          history,
          {
            onEvent: (event) => {
              if (event.type === "tool_call") {
                calls.push({ name: event.name, arguments: event.arguments });
                setState((prev) => ({ ...prev, pendingToolCalls: [...calls] }));
              } else if (event.type === "tool_result") {
                for (let i = calls.length - 1; i >= 0; i--) {
                  const tc = calls[i];
                  if (tc.name === event.name && tc.result == null && tc.error == null) {
                    calls[i] = { ...tc, result: event.result, error: event.error };
                    break;
                  }
                }
                setState((prev) => ({ ...prev, pendingToolCalls: [...calls] }));
              } else if (event.type === "final") {
                const assistant: Message = {
                  role: "assistant",
                  content: event.result,
                  toolCalls: [...calls],
                };
                setState((prev) => ({
                  messages: [...prev.messages, assistant],
                  pendingToolCalls: [],
                  isStreaming: false,
                  error: null,
                }));
              }
            },
          },
          controller.signal,
        );
      } catch (err) {
        if (controller.signal.aborted) return;
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    },
    [state.messages, state.isStreaming],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setState(initialState);
  }, []);

  return { ...state, send, reset };
}
