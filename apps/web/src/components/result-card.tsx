import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AgentRunState } from "@/lib/types";

interface ResultCardProps {
  state: AgentRunState;
}

export function ResultCard({ state }: ResultCardProps) {
  if (state.status === "idle") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Result</CardTitle>
          <StatusBadge status={state.status} />
        </div>
        {(state.requestId ?? state.traceId) && (
          <CardDescription className="font-mono text-[11px]">
            {state.requestId && <span>request: {state.requestId}</span>}
            {state.requestId && state.traceId && <span className="mx-2">·</span>}
            {state.traceId && <span>trace: {state.traceId}</span>}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {state.status === "running" && (
          <p className="text-sm text-muted-foreground">Streaming…</p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.error ?? "Unknown error."}</p>
        )}
        {state.status === "done" && state.finalResult && (
          <p className="whitespace-pre-wrap text-sm">{state.finalResult}</p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: AgentRunState["status"] }) {
  if (status === "running") return <Badge variant="secondary">running</Badge>;
  if (status === "done") return <Badge>done</Badge>;
  if (status === "error") return <Badge variant="destructive">error</Badge>;
  return <Badge variant="outline">idle</Badge>;
}
