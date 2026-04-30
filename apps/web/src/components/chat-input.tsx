"use client";

import { useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  onSubmit: (content: string) => void;
  onReset: () => void;
  disabled: boolean;
}

export function ChatInput({ onSubmit, onReset, disabled }: ChatInputProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  };

  const handleKey = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKey}
        placeholder="Ask about products, your orders, or place an order. Press Enter to send, Shift+Enter for newline."
        rows={2}
        disabled={disabled}
        className="resize-none text-sm"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{value.length} / 8000</p>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onReset}>
            Reset chat
          </Button>
          <Button type="submit" size="sm" disabled={disabled || value.trim().length === 0}>
            {disabled ? "Sending…" : "Send"}
          </Button>
        </div>
      </div>
    </form>
  );
}
