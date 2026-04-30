"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface PromptFormProps {
  onSubmit: (prompt: string) => void;
  onReset: () => void;
  disabled: boolean;
}

export function PromptForm({ onSubmit, onReset, disabled }: PromptFormProps) {
  const [value, setValue] = useState("");

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const trimmed = value.trim();
        if (!trimmed) return;
        onSubmit(trimmed);
      }}
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Ask the agent to do something. The MCP server's tools are available."
        rows={4}
        disabled={disabled}
        className="resize-none font-mono text-sm"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {value.length} / 8000
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setValue("");
              onReset();
            }}
            disabled={disabled && value.length === 0}
          >
            Clear
          </Button>
          <Button type="submit" size="sm" disabled={disabled || value.trim().length === 0}>
            {disabled ? "Running…" : "Run"}
          </Button>
        </div>
      </div>
    </form>
  );
}
