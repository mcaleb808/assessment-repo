"use client";

import { useEffect, useRef } from "react";

import { ChatInput } from "@/components/chat-input";
import { ChatMessage, PendingMessage } from "@/components/chat-message";
import { HealthIndicator } from "@/components/health-indicator";
import { Separator } from "@/components/ui/separator";
import { useChat } from "@/hooks/use-chat";

export default function Page() {
  const { messages, pendingToolCalls, isStreaming, error, send, reset } = useChat();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, pendingToolCalls.length, isStreaming]);

  return (
    <main className="mx-auto flex h-dvh max-w-3xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Meridian Support</h1>
          <p className="text-sm text-muted-foreground">
            Ask about products, your orders, or place a new order.
          </p>
        </div>
        <HealthIndicator />
      </header>

      <Separator />

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {messages.length === 0 && !isStreaming && (
          <EmptyState onPick={send} />
        )}
        {messages.map((message, index) => (
          <ChatMessage key={index} message={message} />
        ))}
        {isStreaming && <PendingMessage toolCalls={pendingToolCalls} />}
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSubmit={send} onReset={reset} disabled={isStreaming} />
    </main>
  );
}

const SUGGESTIONS = [
  "What computers do you have in stock?",
  "I'd like to look up my recent orders.",
  "Can you help me place an order for a monitor?",
];

function EmptyState({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <p className="text-sm text-muted-foreground">Try one of these to get started.</p>
      <div className="flex flex-col gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            onClick={() => onPick(suggestion)}
            className="rounded-md border border-border/60 px-3 py-2 text-sm transition hover:bg-muted"
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}
