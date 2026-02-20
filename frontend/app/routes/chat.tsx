import { useEffect, useRef, useState } from "react";
import { useStreamResponse } from "../hooks/useStreamResponse";

import SavedConversations from "../components/SavedConversations";
import MessageHistory from "../components/MessageHistory";
import ChatInput from "../components/ChatInput";
import ChatMessage from "../components/ChatMessage";
import type { Message, Conversation } from "../components/types";

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [lastSentPrompt, setLastSentPrompt] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  const { response, loading, error, retryAvailable, sendPrompt, cancelPrompt } = useStreamResponse();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getTitleFromPrompt = (text: string) => text.trim().split(/\s+/).slice(0, 10).join(" ") || "Untitled";

  const handleSend = () => {
    if (!prompt.trim()) return;

    const userMsg: Message = { role: "user", content: prompt };
    setHistory((prev) => [...prev, userMsg]);

    setPendingPrompt(prompt);
    setLastSentPrompt(prompt);

    sendPrompt(prompt);
    setPrompt("");
    setSelectedConversationId(null);
  };

  // When assistant finishes responding, push to history and save a left-side card
  useEffect(() => {
    if (!loading && response) {
      const assistantMsg: Message = { role: "assistant", content: response };
      setHistory((prev) => [...prev, assistantMsg]);

      if (pendingPrompt) {
        const title = getTitleFromPrompt(pendingPrompt);
        const conv: Conversation = {
          id: Date.now(),
          title,
          messages: [
            { role: "user", content: pendingPrompt },
            { role: "assistant", content: response },
          ],
        };
        setSavedConversations((prev) => [conv, ...prev]);
        setPendingPrompt(null);
      }
    }
  }, [loading, response, pendingPrompt]);

  const openConversation = (conv: Conversation) => {
    // don't overwrite the current session `history` — just mark which saved conversation is selected
    setSelectedConversationId(conv.id);
  };

  const handleRetry = () => {
    if (!lastSentPrompt) return;
    setHistory((prev) => [...prev, { role: "user", content: lastSentPrompt }]);
    setPendingPrompt(lastSentPrompt);
    sendPrompt(lastSentPrompt);
  };

  return (
    <div style={{ display: "flex", gap: 24, padding: 20, maxWidth: 1100, margin: "auto" }}>
      <SavedConversations
        conversations={savedConversations}
        selectedId={selectedConversationId}
        onSelect={openConversation}
        onClear={() => {
          setSavedConversations([]);
          setSelectedConversationId(null);
        }}
      />

      <main style={{ flex: 1 }}>
        <h2 style={{ marginTop: 0 }}>Chat with AI Assistant</h2>

        <ChatInput
          prompt={prompt}
          setPrompt={setPrompt}
          onSend={handleSend}
          loading={loading}
          cancelPrompt={cancelPrompt}
          retryAvailable={retryAvailable}
          lastSentPrompt={lastSentPrompt}
          onRetry={handleRetry}
        />

        {error && <div style={{ color: "red", marginTop: 8 }}>Error: {error}</div>}

        {/*
          If a saved conversation is selected show its full message history.
          Otherwise show only the current interaction: last user message + streaming assistant bubble.
        */}
        {selectedConversationId ? (
          (() => {
            const active = savedConversations.find((c) => c.id === selectedConversationId)!;
            return (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <strong>{active.title}</strong>
                  <button onClick={() => setSelectedConversationId(null)} style={{ marginLeft: 12 }}>
                    Back
                  </button>
                </div>

                <MessageHistory history={active.messages} loading={false} response={""} messagesEndRef={messagesEndRef} />
              </div>
            );
          })()
        ) : (
          <div style={{ marginTop: 20 }}>
            {/* show only the latest user message (if any) */}
            {(() => {
              const lastUser = [...history].reverse().find((m) => m.role === "user");
              return lastUser ? <ChatMessage message={lastUser} /> : null;
            })()}

            {/* streaming / assistant bubble for current chat interaction */}
            {loading ? (
              <div style={{ textAlign: "left", margin: "8px 0" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "10px 14px",
                    borderRadius: 12,
                    backgroundColor: "#F1F0F0",
                    maxWidth: "80%",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {response || "..."}
                </span>
              </div>
            ) : (
              response && (
                <div style={{ textAlign: "left", margin: "8px 0" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "10px 14px",
                      borderRadius: 12,
                      backgroundColor: "#F1F0F0",
                      maxWidth: "80%",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {response}
                  </span>
                </div>
              )
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>
    </div>
  );
}
