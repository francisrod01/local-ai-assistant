import React from "react";
import ChatInput from "./ChatInput";
import ChatSidebarHeader from "./ChatSidebarHeader";
import MessageHistory from "./MessageHistory";
import SavedConversations from "../SavedConversations";
import PageHeader from "../PageHeader";
import type { ChatViewProps } from "./types";
import { useScrollToBottom } from "./useScrollToBottom";

export default function ChatView(props: ChatViewProps) {
  const {
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
  } = props;

  // compute active conversation once so we can use it in several places
  const activeConversation =
    selectedConversationId !== null
      ? savedConversations.find((c) => c.id === selectedConversationId)!
      : null;

  const { messagesContainerRef, showScrollToBottom, scrollToBottom } = useScrollToBottom({
    activeConversationId: activeConversation?.id ?? null,
    messagesLength: activeConversation?.messages.length ?? 0,
    response,
    loading,
    messagesEndRef,
  });

  return (
    <main className="pt-[30px] p-4 container mx-auto">
      <PageHeader
        title="Chat with AI Assistant"
        description="Interact with the assistant using the shared logo block commonly used on other pages."
      />
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

        <div className="relative flex-1 h-[calc(100vh-8.5rem)] bg-white rounded-xl shadow-sm ring-1 ring-black/10 flex flex-col">
          <div
            ref={messagesContainerRef}
            className="relative flex-1 overflow-y-auto p-3"
          >
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

            {showScrollToBottom && (
              <button
                type="button"
                onClick={scrollToBottom}
                className="sticky bottom-4 left-1/2 -translate-x-1/2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white shadow ring-1 ring-black/10 text-gray-600 hover:bg-gray-50 cursor-pointer z-10"
                aria-label="Scroll to newest"
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
                  <path d="M12 5v14" />
                  <path d="M19 12l-7 7-7-7" />
                </svg>
              </button>
            )}
          </div>

          <div className="bg-white p-3">
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
