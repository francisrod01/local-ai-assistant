import React from "react";
import ChatInput from "./ChatInput";
import MessageHistory from "./MessageHistory";
import SavedConversations from "../SavedConversations";
import type { Conversation } from "../types";

interface Props {
  prompt: string;
  setPrompt: (v: string) => void;
  savedConversations: Conversation[];
  selectedConversationId: string | null;
  response: string;
  loading: boolean;
  error: string | null;
  retryAvailable: boolean;
  cancelPrompt: () => void;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  handleSend: () => void;
  handleRetry: () => void;
  openConversation: (c: Conversation) => void;
  deleteConversation: (id: string) => void;
  clearHistory: () => Promise<void>;
  newConversation: () => void;
  lastSentPrompt: string | null;
}

export default function ChatView({
  prompt,
  setPrompt,
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
  deleteConversation,
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
          onDelete={deleteConversation}
        />

        <div className="flex-1">
          <h2 className="mt-0 mb-6">Chat with AI Assistant</h2>

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

          <div className="mt-2">
            {activeConversation ? (
              <MessageHistory
                history={activeConversation.messages}
                loading={loading}
                response={response}
                messagesEndRef={messagesEndRef}
              />
            ) : (
              <div className="text-gray-500 text-sm mt-4">
                Start a new conversation, or select one from the left.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
