import React from "react";
import type { Conversation } from "./types";

interface Props {
  conversations: Conversation[];
  selectedId?: string | null;
  onSelect: (c: Conversation) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export default function SavedConversations({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onClear,
}: Props) {
  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="flex items-center justify-between mb-3">
        <h3 className="mt-0">Conversations</h3>
      </div>

      <div className="flex flex-col gap-2 md:flex-1 md:overflow-y-auto max-h-[70vh] md:max-h-none">
        {conversations.length === 0 && (
          <div className="text-gray-600 text-xs">No saved conversations yet — responses will appear here after streaming.</div>
        )}

        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            className={`border p-2 rounded-lg cursor-pointer bg-white ${selectedId === c.id ? "border-2 border-gray-300" : "border"
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs mb-1">{c.title}</div>
              </div>
              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  aria-label="Delete conversation"
                  title="Delete conversation"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this conversation?")) {
                      onDelete(c.id);
                    }
                  }}
                  className="text-gray-400 hover:text-red-600"
                >
                  <svg
                    aria-hidden="true"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    <path d="M10 11v6" />
                    <path d="M14 11v6" />
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {conversations.length > 0 && (
        <div className="mt-3">
          <button
            className="text-sm text-blue-600"
            onClick={() => {
              if (window.confirm("Clear all conversation history?")) {
                onClear();
              }
            }}
          >
            Clear history
          </button>
        </div>
      )}
    </div>
  );
}
