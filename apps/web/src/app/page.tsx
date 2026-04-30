"use client";

import { HealthIndicator } from "@/components/health-indicator";
import { PromptForm } from "@/components/prompt-form";
import { ResultCard } from "@/components/result-card";
import { ToolCallList } from "@/components/tool-call-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAgentStream } from "@/hooks/use-agent-stream";

export default function Page() {
  const { state, start, reset } = useAgentStream();

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">MCP Agent</h1>
          <p className="text-sm text-muted-foreground">
            Send a prompt - the agent calls MCP tools and streams the result back.
          </p>
        </div>
        <HealthIndicator />
      </header>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <PromptForm
            onSubmit={start}
            onReset={reset}
            disabled={state.status === "running"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Stream</CardTitle>
        </CardHeader>
        <CardContent>
          <ToolCallList events={state.events} />
        </CardContent>
      </Card>

      <ResultCard state={state} />
    </main>
  );
}
