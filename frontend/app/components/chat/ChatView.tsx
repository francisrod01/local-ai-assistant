import React from "react";
import ChatInput from "./ChatInput";
import MessageHistory from "./MessageHistory";
import ChatMessage from "./ChatMessage";
import SavedConversations from "../SavedConversations";
import type { Message, Conversation } from "../types";

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  history: Message[];
  savedConversations: Conversation[];
  selectedConversationId: number | null;
  response: string;
  loading: boolean;
  error: string | null;
  retryAvailable: boolean;
  sendPrompt: (p: string) => void;
  cancelPrompt: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: () => void;
  handleRetry: () => void;
  openConversation: (c: Conversation) => void;
  clearHistory: () => Promise<void>;
  newConversation: () => void;
  lastSentPrompt: string | null;
}

export default function ChatView({
  prompt,
  setPrompt,
  history,
  savedConversations,
  selectedConversationId,
  response,
  loading,
  error,
  retryAvailable,
  cancelPrompt,
  messagesEndRef,
  handleSend,
  handleRetry,
  openConversation,
  clearHistory,
  newConversation,
  lastSentPrompt,
}: Props) {
  return (
    <div style={{ display: "flex", gap: 24, padding: 20, maxWidth: 1100, margin: "auto" }}>
      <SavedConversations
        conversations={savedConversations}
        selectedId={selectedConversationId}
        onSelect={openConversation}
        onNew={newConversation}
        onClear={clearHistory}
      />

      <main style={{ flex: 1 }}>
        {!selectedConversationId && (
          <>
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
          </>
        )}

        {selectedConversationId ? (
          (() => {
            const active = savedConversations.find((c) => c.id === selectedConversationId)!;
            return (
              <div>
                <div style={{ marginTop: 8 }}>
                  <strong>{active.title}</strong>
                </div>

                <MessageHistory history={active.messages} loading={false} response={""} messagesEndRef={messagesEndRef} />
              </div>
            );
          })()
        ) : (
          <div style={{ marginTop: 20 }}>
            {(() => {
              const lastUser = [...history].reverse().find((m) => m.role === "user");
              return lastUser ? <ChatMessage message={lastUser} /> : null;
            })()}

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
