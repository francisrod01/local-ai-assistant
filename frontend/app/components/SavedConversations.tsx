import React from "react";
import type { Conversation } from "./types";

interface Props {
  conversations: Conversation[];
  selectedId?: number | null;
  onSelect: (c: Conversation) => void;
  onClear: () => void;
}

export default function SavedConversations({ conversations, selectedId, onSelect, onClear }: Props) {
  return (
    <aside style={{ width: 260 }}>
      <h3 style={{ marginTop: 0 }}>Conversations</h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflowY: "auto" }}>
        {conversations.length === 0 && (
          <div style={{ color: "#666", fontSize: 13 }}>No saved conversations yet — responses will appear here after streaming.</div>
        )}

        {conversations.map((c) => (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            style={{
              border: selectedId === c.id ? "2px solid #ccc" : "1px solid #eee",
              padding: 10,
              borderRadius: 8,
              cursor: "pointer",
              background: "#fff",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{c.title}</div>
            <div style={{ color: "#666", fontSize: 12, lineHeight: 1.2, maxHeight: 40, overflow: "hidden" }}>{c.messages[1]?.content ?? ""}</div>
          </div>
        ))}
      </div>

      {conversations.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <button onClick={onClear}>Clear history</button>
        </div>
      )}
    </aside>
  );
}
