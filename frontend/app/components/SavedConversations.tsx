import React from "react";
import type { Conversation } from "./types";

interface Props {
  conversations: Conversation[];
  selectedId?: number | null;
  onSelect: (c: Conversation) => void;
  onClear: () => void;
  onNew: () => void; // start a fresh chat
}

export default function SavedConversations({ conversations, selectedId, onSelect, onClear, onNew }: Props) {
  return (
    <aside className="w-64">
      <div className="flex items-center justify-between">
        <h3 className="mt-0">Conversations</h3>
        <button
          aria-label="New conversation"
          title="New conversation"
          onClick={onNew}
          className="text-xl leading-none px-2 cursor-pointer"
        >
          +
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
            <div className="font-semibold text-xs mb-1">{c.title}</div>
            <div className="text-gray-600 text-xs leading-tight max-h-10 overflow-hidden">
              {c.messages[1]?.content ?? ""}
            </div>
          </div>
        ))}
      </div>

      {conversations.length > 0 && (
        <div className="mt-3">
          <button className="text-sm text-blue-600" onClick={onClear}>
            Clear history
          </button>
        </div>
      )}
    </aside>
  );
}
