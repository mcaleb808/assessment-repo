"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { ToolCall } from "@/lib/types";

interface ToolCallsProps {
  calls: ToolCall[];
  defaultOpen?: boolean;
}

export function ToolCalls({ calls, defaultOpen = false }: ToolCallsProps) {
  const [open, setOpen] = useState(defaultOpen);
  if (calls.length === 0) return null;

  return (
    <div className="mt-2 rounded-md border border-border/60 bg-background/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-muted-foreground transition hover:text-foreground"
      >
        <Badge variant="outline" className="font-mono text-[10px]">
          {calls.length} tool {calls.length === 1 ? "call" : "calls"}
        </Badge>
        <span className="truncate font-mono">{calls.map((c) => c.name).join(" · ")}</span>
        <span className="ml-auto select-none text-[10px]">{open ? "hide" : "show"}</span>
      </button>
      {open && (
        <ul className="divide-y border-t">
          {calls.map((call, index) => (
            <li key={index} className="px-3 py-2">
              <div className="flex items-center gap-2">
                <Badge
                  variant={call.error ? "destructive" : call.result == null ? "outline" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {call.error ? "error" : call.result == null ? "pending" : "ok"}
                </Badge>
                <p className="font-mono text-xs">{call.name}</p>
              </div>
              {Object.keys(call.arguments).length > 0 && (
                <pre className="mt-1 max-h-32 overflow-auto rounded bg-muted px-2 py-1 text-[11px] text-muted-foreground">
                  {JSON.stringify(call.arguments, null, 2)}
                </pre>
              )}
              {(call.result ?? call.error) && (
                <pre className="mt-1 max-h-48 overflow-auto rounded bg-muted px-2 py-1 text-[11px] whitespace-pre-wrap break-words">
                  {call.error ?? call.result}
                </pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
