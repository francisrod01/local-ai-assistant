import React from "react";
import type { Conversation } from "./types";

interface Props {
  conversations: Conversation[];
  selectedId?: string | null;
  onSelect: (c: Conversation) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onNew: () => void; // start a fresh chat
}

export default function SavedConversations({
  conversations,
  selectedId,
  onSelect,
  onDelete,
  onClear,
  onNew,
}: Props) {
  return (
    <aside className="w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="mt-0">Conversations</h3>
        <button
          type="button"
          aria-label="New conversation"
          title="New conversation"
          onClick={onNew}
          className="p-1 rounded text-gray-700 hover:text-blue-600 cursor-pointer"
        >
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />
            <line x1="18" y1="8" x2="18" y2="14" />
            <line x1="15" y1="11" x2="21" y2="11" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-2 max-h-[70vh] overflow-y-auto">
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
    </aside>
  );
}
