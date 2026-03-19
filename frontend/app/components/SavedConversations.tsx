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
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

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
            onMouseLeave={() => setOpenMenuId(null)}
            className={`group relative p-2 rounded-xl cursor-pointer bg-white hover:bg-gray-50 ${selectedId === c.id
              ? "bg-blue-50 shadow-sm before:absolute before:left-0 before:top-0 before:h-full before:w-1 before:rounded-l-xl before:bg-blue-500"
              : ""
              }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs mb-1">{c.title}</div>
              </div>

              <div className="flex items-center shrink-0">
                <button
                  type="button"
                  aria-label="Conversation options"
                  title="Conversation options"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenMenuId((prev) => (prev === c.id ? null : c.id));
                  }}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 rounded-md bg-transparent p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                >
                  <span className="sr-only">Open conversation menu</span>
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
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="19" cy="12" r="1" />
                    <circle cx="5" cy="12" r="1" />
                  </svg>
                </button>

                {openMenuId === c.id && (
                  <div
                    className="absolute right-2 top-10 z-10 w-36 rounded-lg bg-white shadow-lg ring-1 ring-black/10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setOpenMenuId(null);
                        if (window.confirm("Delete this conversation?")) {
                          onDelete(c.id);
                        }
                      }}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Delete conversation
                    </button>
                  </div>
                )}
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
