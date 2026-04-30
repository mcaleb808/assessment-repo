"use client";

import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { StreamEvent } from "@/lib/types";

interface ToolCallListProps {
  events: StreamEvent[];
}

export function ToolCallList({ events }: ToolCallListProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-muted-foreground italic">
        Stream is quiet. Submit a prompt to see tool activity here.
      </p>
    );
  }

  return (
    <ScrollArea className="h-72 rounded-md border">
      <ul className="divide-y">
        {events.map((event, index) => (
          <li key={index} className="px-3 py-2">
            {event.type === "tool_call" && (
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="font-mono text-[10px]">
                  call
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm">{event.name}</p>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                    {JSON.stringify(event.arguments, null, 2)}
                  </pre>
                </div>
              </div>
            )}
            {event.type === "tool_result" && (
              <div className="flex items-start gap-2">
                <Badge
                  variant={event.error ? "destructive" : "secondary"}
                  className="font-mono text-[10px]"
                >
                  {event.error ? "error" : "result"}
                </Badge>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-sm">{event.name}</p>
                  <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-muted-foreground">
                    {event.error ?? event.result ?? ""}
                  </pre>
                </div>
              </div>
            )}
            {event.type === "final" && (
              <div className="flex items-start gap-2">
                <Badge className="font-mono text-[10px]">final</Badge>
                <p className="text-sm">stream closed</p>
              </div>
            )}
          </li>
        ))}
      </ul>
      <Separator />
    </ScrollArea>
  );
}
