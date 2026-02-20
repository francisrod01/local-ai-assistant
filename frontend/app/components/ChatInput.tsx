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
  return (
    <div style={{ marginBottom: 10 }}>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Type your message..."
        rows={3}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <div style={{ marginTop: 10 }}>
        <button onClick={onSend} disabled={loading}>
          {loading ? "Thinking..." : "Send"}
        </button>

        {loading && (
          <button onClick={cancelPrompt} style={{ marginLeft: 10 }}>
            Cancel
          </button>
        )}

        {retryAvailable && (
          <button onClick={onRetry} style={{ marginLeft: 10 }} disabled={!lastSentPrompt}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
