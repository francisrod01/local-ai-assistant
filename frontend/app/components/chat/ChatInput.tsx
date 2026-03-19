import React, { useCallback, useEffect, useRef } from "react";
import type { ChatInputProps } from "./types";

export default function ChatInput({
  prompt,
  setPrompt,
  onSend,
  loading,
  cancelPrompt,
  retryAvailable,
  lastSentPrompt,
  onRetry,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const isSendDisabled = loading || !prompt.trim();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const maxHeight = 280;
    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
  }, [prompt]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        if (!isSendDisabled) {
          onSend();
        }
      }
    },
    [isSendDisabled, onSend]
  );

  return (
    <div className="relative rounded-xl bg-white/80 shadow-sm ring-1 ring-gray-200 p-4">
      <textarea
        ref={textareaRef}
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        rows={1}
        className="w-full mb-3 resize-none overflow-y-auto rounded-lg p-3 bg-white/70 shadow-inner focus:outline-none focus:ring-2 focus:ring-blue-200"
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">Press Enter to send</div>

        <button
          onClick={onSend}
          disabled={isSendDisabled}
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white transition-opacity ${isSendDisabled ? "opacity-0 pointer-events-none" : "opacity-100"
            }`}
          aria-label="Send message"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      {loading && (
        <button
          onClick={cancelPrompt}
          className="mt-3 w-full rounded-md bg-gray-100 py-2 text-sm text-gray-700"
        >
          Cancel
        </button>
      )}

      {retryAvailable && (
        <button
          onClick={onRetry}
          disabled={!lastSentPrompt}
          className="mt-2 w-full rounded-md bg-gray-100 py-2 text-sm text-gray-700 disabled:opacity-50"
        >
          Retry
        </button>
      )}
    </div>
  );
}
