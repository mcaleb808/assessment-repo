import { ToolCalls } from "@/components/tool-calls";
import { cn } from "@/lib/utils";
import type { Message, ToolCall } from "@/lib/types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        {!isUser && message.toolCalls && message.toolCalls.length > 0 && (
          <ToolCalls calls={message.toolCalls} />
        )}
      </div>
    </div>
  );
}

interface PendingMessageProps {
  toolCalls: ToolCall[];
}

export function PendingMessage({ toolCalls }: PendingMessageProps) {
  return (
    <div className="flex w-full justify-start">
      <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2 text-sm">
        <p className="text-muted-foreground italic">
          {toolCalls.length === 0 ? "Thinking…" : `Working… (${toolCalls.length} tool ${toolCalls.length === 1 ? "call" : "calls"})`}
        </p>
        {toolCalls.length > 0 && <ToolCalls calls={toolCalls} defaultOpen />}
      </div>
    </div>
  );
}
