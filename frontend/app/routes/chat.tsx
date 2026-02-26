import { useEffect, useRef, useState } from "react";
import { useStreamResponse } from "../hooks/useStreamResponse";

import SavedConversations from "../components/SavedConversations";
import MessageHistory from "../components/MessageHistory";
import ChatInput from "../components/ChatInput";
import ChatMessage from "../components/ChatMessage";
import type { Message, Conversation } from "../components/types";

// shape returned from the backend
type InteractionOut = {
  id: number;
  prompt: string;
  response: string;
  user: string;
  created_at: string;
};

export default function Chat() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);

  // helper used by multiple pieces of logic
  const getTitleFromPrompt = (text: string) => text.trim().split(/\s+/).slice(0, 10).join(" ") || "Untitled";

  // load persisted history when component mounts
  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/history");
        if (!res.ok) throw new Error("failed to fetch history");
        const data: InteractionOut[] = await res.json();
        const convs: Conversation[] = data.map((item) => ({
          id: item.id,
          title: getTitleFromPrompt(item.prompt),
          messages: [
            { role: "user", content: item.prompt },
            { role: "assistant", content: item.response },
          ],
        }));
        setSavedConversations(convs);
      } catch (err) {
        console.error("could not load conversation history", err);
      }
    }

    loadHistory();
  }, []);

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [lastSentPrompt, setLastSentPrompt] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  const { response, loading, error, retryAvailable, sendPrompt, cancelPrompt } = useStreamResponse();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const handleSend = () => {
    if (!prompt.trim()) return;

    const userMsg: Message = { role: "user", content: prompt };
    setHistory((prev: Message[]) => [...prev, userMsg]);

    setPendingPrompt(prompt);
    setLastSentPrompt(prompt);

    sendPrompt(prompt);
    setPrompt("");
    setSelectedConversationId(null);
  };

  // When assistant finishes responding, push to history and save a left-side card
  useEffect(() => {
    if (!loading && response && pendingPrompt) {
      const assistantMsg: Message = { role: "assistant", content: response };
      setHistory((prev: Message[]) => [...prev, assistantMsg]);

      const title = getTitleFromPrompt(pendingPrompt);

      // save interaction to backend and add to local list once we have an ID
      (async () => {
        try {
          const res = await fetch("/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: pendingPrompt, response, user: "user_1" }),
          });
          const saved: InteractionOut = await res.json();
          const conv: Conversation = {
            id: saved.id,
            title,
            messages: [
              { role: "user", content: pendingPrompt },
              { role: "assistant", content: response },
            ],
          };
          setSavedConversations((prev: Conversation[]) => [conv, ...prev]);
        } catch (err) {
          console.error("failed to persist conversation", err);
          // fallback to storing locally without id
          const conv: Conversation = {
            id: Date.now(),
            title,
            messages: [
              { role: "user", content: pendingPrompt },
              { role: "assistant", content: response },
            ],
          };
          setSavedConversations((prev: Conversation[]) => [conv, ...prev]);
        }
      })();

      setPendingPrompt(null);
    }
  }, [loading, response, pendingPrompt]);

  const openConversation = (conv: Conversation) => {
    // don't overwrite the current session `history` — just mark which saved conversation is selected
    setSelectedConversationId(conv.id);
  };

  const handleRetry = () => {
    if (!lastSentPrompt) return;
    setHistory((prev: Message[]) => [...prev, { role: "user", content: lastSentPrompt }]);
    setPendingPrompt(lastSentPrompt);
    sendPrompt(lastSentPrompt);
  };

  return (
    <div style={{ display: "flex", gap: 24, padding: 20, maxWidth: 1100, margin: "auto" }}>
      <SavedConversations
        conversations={savedConversations}
        selectedId={selectedConversationId}
        onSelect={openConversation}
        onClear={async () => {
          try {
            await fetch("/history", { method: "DELETE" });
          } catch (err) {
            console.error("failed to clear history", err);
          }
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
              <ChatMessage message={{ role: "assistant", content: response || "..." }} />
            ) : (
              response && <ChatMessage message={{ role: "assistant", content: response }} />
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </main>
    </div>
  );
}
