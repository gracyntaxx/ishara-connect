"use client";

import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { useDialogueStore } from "../stores";
import type { DialogueMessage } from "../stores/useDialogueStore";

interface DialoguePanelProps {
  className?: string;
  localUserId?: string;
}

export function DialoguePanel({ className = "", localUserId }: DialoguePanelProps) {
  const { messages, showGloss, autoScroll, toggleShowGloss } = useDialogueStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getMessageClass = (message: DialogueMessage) => {
    const isLocal = message.senderId === localUserId;
    const base = "flex gap-3 animate-in";
    if (isLocal) return `${base} flex-row-reverse`;
    return base;
  };

  const getBubbleClass = (message: DialogueMessage) => {
    const isLocal = message.senderId === localUserId;
    const base = "max-w-[70%] rounded-2xl px-4 py-2";
    if (message.type === "system") {
      return `${base} bg-muted text-center text-sm text-muted-foreground`;
    }
    if (isLocal) {
      return `${base} bg-primary text-primary-foreground rounded-tr-sm`;
    }
    return `${base} bg-secondary/10 text-secondary-foreground rounded-tl-sm`;
  };

  const getSenderName = (message: DialogueMessage) => {
    if (message.type === "system") return null;
    const isLocal = message.senderId === localUserId;
    return isLocal ? "You" : message.senderName;
  };

  if (messages.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-lg font-semibold text-foreground">Dialogue</h2>
          <button
            onClick={toggleShowGloss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            aria-pressed={showGloss}
          >
            {showGloss ? "Show English" : "Show Gloss"}
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-muted-foreground">
            <svg
              className="mx-auto h-12 w-12 text-muted-foreground/50"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
            <p className="mt-2">No messages yet</p>
            <p className="text-sm">Start a call or practice to see dialogue here</p>
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h2 className="text-lg font-semibold text-foreground">Dialogue</h2>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => useDialogueStore.getState().setAutoScroll(e.target.checked)}
              className="h-4 w-4 rounded border-input"
            />
            Auto-scroll
          </label>
          <button
            onClick={toggleShowGloss}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-accent"
            aria-pressed={showGloss}
          >
            {showGloss ? "Show English" : "Show Gloss"}
          </button>
        </div>
      </div>
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        role="log"
        aria-live="polite"
        aria-label="Conversation history"
      >
        {messages.map((message) => (
          <div key={message.id} className={getMessageClass(message)}>
            {!message.type === "system" && message.senderId !== localUserId && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center text-xs font-medium text-secondary">
                {message.senderName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className={getBubbleClass(message)}>
              {message.type !== "system" && (
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground">
                    {getSenderName(message)}
                  </span>
                  {message.type === "sign" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Sign
                    </span>
                  )}
                  {message.type === "speech" && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-secondary/10 text-secondary">
                      Speech
                    </span>
                  )}
                  <span
                    className="text-xs text-muted-foreground/70"
                    title={new Date(message.timestamp).toLocaleString()}
                  >
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              )}
              <div className="text-base">
                {showGloss && message.gloss ? message.gloss : message.text}
              </div>
              {message.confidence !== undefined && message.type === "sign" && (
                <div className="mt-1 flex items-center gap-1">
                  <div className="h-1.5 flex-1 max-w-32 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${message.confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.round(message.confidence * 100)}%
                  </span>
                </div>
              )}
            </div>
            {message.senderId === localUserId && message.type !== "system" && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                Y
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
