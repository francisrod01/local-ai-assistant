import React from "react";
import ChatInput from "./ChatInput";
import ChatSidebarHeader from "./ChatSidebarHeader";
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
        <aside className="w-full md:w-72 md:sticky md:top-4 md:self-start md:h-[calc(100vh-8.5rem)] flex flex-col">
          <ChatSidebarHeader onNew={newConversation} />
          <SavedConversations
            conversations={savedConversations}
            selectedId={selectedConversationId}
            onSelect={openConversation}
            onClear={clearHistory}
            onDelete={deleteConversation}
          />
        </aside>

        <div className="flex-1 min-h-[65vh] md:h-[calc(100vh-8.5rem)] border rounded-lg bg-white flex flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {error && <div className="text-red-600 mb-2">Error: {error}</div>}

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

          <div className="border-t bg-white p-3">
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
          </div>
        </div>
      </div>
    </main>
  );
}
