import React from "react";

interface Props {
  prompt: string;
  setPrompt: (s: string) => void;
  onSend: () => void;
  loading: boolean;
  cancelPrompt: () => void;
  retryAvailable: boolean;
  lastSentPrompt: string | null;
  onRetry: () => void;
}

export default function ChatInput({ prompt, setPrompt, onSend, loading, cancelPrompt, retryAvailable, lastSentPrompt, onRetry }: Props) {
  const isSendDisabled = loading || !prompt.trim();

  return (
    <div>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your message..."
        rows={3}
        className="w-full mb-2 border rounded p-2"
      />

      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={onSend}
          disabled={isSendDisabled}
          className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Send"}
        </button>

        {loading && (
          <button
            onClick={cancelPrompt}
            className="px-3 py-1 rounded bg-gray-300"
          >
            Cancel
          </button>
        )}

        {retryAvailable && (
          <button
            onClick={onRetry}
            disabled={!lastSentPrompt}
            className="px-3 py-1 rounded bg-gray-300 disabled:opacity-50"
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
