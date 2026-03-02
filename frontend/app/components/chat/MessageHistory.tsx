import React from "react";
import ChatMessage from "./ChatMessage";
import type { Message } from "../types";

interface Props {
  history: Message[];
  loading: boolean;
  response: string;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export default function MessageHistory({ history, loading, response, messagesEndRef }: Props) {
  return (
    <div style={{ marginTop: 20 }}>
      {history.map((msg, idx) => (
        <ChatMessage key={idx} message={msg} />
      ))}

      {loading && (
        <div style={{ textAlign: "left", margin: "8px 0" }}>
          <span
            style={{
              display: "inline-block",
              padding: "10px 14px",
              borderRadius: 12,
              backgroundColor: "#F1F0F0",
              maxWidth: "80%",
              whiteSpace: "pre-wrap",
            }}
          >
            {response || "..."}
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
