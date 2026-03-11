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
  // compute active conversation once so we can use it in several places
  const activeConversation =
    selectedConversationId !== null
      ? savedConversations.find((c) => c.id === selectedConversationId)!
      : null;

  return (
    <main className="pt-[30px] p-4 container mx-auto">
      <div className="flex flex-col gap-3 md:flex-row md:items-start">
        <SavedConversations
          conversations={savedConversations}
          selectedId={selectedConversationId}
          onSelect={openConversation}
          onNew={newConversation}
          onClear={clearHistory}
        />

        <div className="flex-1">
          <h2 className="mt-0 mb-6">Chat with AI Assistant</h2>

          {!selectedConversationId && (
            <>
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

              {error && <div className="text-red-600 mt-2">Error: {error}</div>}
            </>
          )}

          {selectedConversationId ? (
            <div className="mt-2">
              <MessageHistory
                history={activeConversation!.messages}
                loading={false}
                response=""
                messagesEndRef={messagesEndRef}
              />
            </div>
          ) : (
            <div className="mt-5">
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
        </div>
      </div>
    </main>
  );
}
