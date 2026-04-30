"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { checkHealth } from "@/lib/api";

type Health = "checking" | "healthy" | "degraded" | "unreachable";

export function HealthIndicator() {
  const [status, setStatus] = useState<Health>("checking");
  const [mcp, setMcp] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const body = await checkHealth();
        if (cancelled) return;
        setStatus(body.mcp_configured ? "healthy" : "degraded");
        setMcp(body.mcp_configured);
      } catch {
        if (!cancelled) setStatus("unreachable");
      }
    };
    void tick();
    const interval = window.setInterval(tick, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  if (status === "checking") return <Badge variant="outline">checking…</Badge>;
  if (status === "unreachable") return <Badge variant="destructive">api unreachable</Badge>;
  if (status === "degraded")
    return (
      <Badge variant="secondary" title="API up, but MCP server is not configured">
        api up · mcp pending
      </Badge>
    );
  return <Badge title={mcp ? "API and MCP both ready" : ""}>healthy</Badge>;
}
