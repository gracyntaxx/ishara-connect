"use client";

import { useEffect, useRef } from "react";
import { formatDistanceToNow } from "date-fns";
import { useDialogueStore } from "../stores";
import type { DialogueMessage } from "../stores/useDialogueStore";
import { Hand, Mic, MessageSquare } from "lucide-react";

interface DialoguePanelProps {
  className?: string;
  localUserId?: string;
}

export function DialoguePanel({ className = "", localUserId }: DialoguePanelProps) {
  const { messages, autoScroll } = useDialogueStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const formatTimestamp = (timestamp: number) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const isLocal = (message: DialogueMessage) => message.senderId === localUserId;

  if (messages.length === 0) {
    return (
      <div className={`flex flex-col h-full bg-white ${className}`}>
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8eaed] bg-white">
          <MessageSquare className="w-4 h-4 text-[#1a73e8]" />
          <h2 className="text-sm font-semibold text-[#202124]">Live Transcript</h2>
          <span className="ml-auto text-[10px] text-[#80868b] bg-[#f1f3f4] px-2 py-0.5 rounded-full">
            Both-way
          </span>
        </div>
        {/* Empty state */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#e8f0fe] flex items-center justify-center mx-auto mb-3">
              <Hand className="w-7 h-7 text-[#1a73e8]" />
            </div>
            <p className="text-sm font-medium text-[#202124]">No messages yet</p>
            <p className="text-xs text-[#5f6368] mt-1 max-w-[180px] mx-auto leading-relaxed">
              Make a gesture or speak — transcripts appear here for both participants
            </p>
          </div>
        </div>
        <div ref={messagesEndRef} />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8eaed] bg-white flex-shrink-0">
        <MessageSquare className="w-4 h-4 text-[#1a73e8]" />
        <h2 className="text-sm font-semibold text-[#202124]">Live Transcript</h2>
        <span className="ml-auto text-[10px] text-[#34a853] bg-[#e6f4ea] px-2 py-0.5 rounded-full font-medium">
          {messages.length} message{messages.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa]"
        role="log"
        aria-live="polite"
        aria-label="Conversation transcript"
      >
        {messages.map((message) => {
          const mine = isLocal(message);
          if (message.type === "system") {
            return (
              <div key={message.id} className="flex justify-center">
                <span className="text-xs text-[#5f6368] bg-white border border-[#e8eaed] px-3 py-1 rounded-full">
                  {message.text}
                </span>
              </div>
            );
          }

          return (
            <div key={message.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                  mine
                    ? "bg-[#1a73e8] text-white"
                    : "bg-[#e8eaed] text-[#3c4043]"
                }`}
              >
                {mine ? "Y" : (message.senderName?.charAt(0) ?? "P").toUpperCase()}
              </div>

              {/* Bubble */}
              <div className={`max-w-[72%] ${mine ? "items-end" : "items-start"} flex flex-col gap-1`}>
                {/* Sender + type tag */}
                <div className={`flex items-center gap-1.5 ${mine ? "flex-row-reverse" : "flex-row"}`}>
                  <span className="text-[10px] font-medium text-[#5f6368]">
                    {mine ? "You" : message.senderName}
                  </span>
                  {message.type === "sign" && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[#e8f0fe] text-[#1a73e8] font-semibold">
                      <Hand className="w-2.5 h-2.5" /> Gesture
                    </span>
                  )}
                  {message.type === "speech" && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full bg-[#e6f4ea] text-[#34a853] font-semibold">
                      <Mic className="w-2.5 h-2.5" /> Speech
                    </span>
                  )}
                </div>

                {/* Text bubble */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    mine
                      ? "bg-[#1a73e8] text-white rounded-tr-sm"
                      : "bg-white text-[#202124] border border-[#e8eaed] rounded-tl-sm"
                  }`}
                >
                  {message.text}
                </div>

                {/* Confidence bar + timestamp */}
                <div className={`flex items-center gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                  {message.confidence !== undefined && message.type === "sign" && (
                    <div className="flex items-center gap-1">
                      <div className="w-14 h-1 bg-[#e8eaed] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#1a73e8] rounded-full"
                          style={{ width: `${Math.round(message.confidence * 100)}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-[#80868b]">
                        {Math.round(message.confidence * 100)}%
                      </span>
                    </div>
                  )}
                  <span className="text-[9px] text-[#80868b]">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
