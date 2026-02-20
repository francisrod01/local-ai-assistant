import React from "react";
import type { Message } from "./types";

interface Props {
  message: Message;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div style={{ textAlign: isUser ? "right" : "left", margin: "8px 0" }}>
      <span
        style={{
          display: "inline-block",
          padding: "10px 14px",
          borderRadius: 12,
          backgroundColor: isUser ? "#DCF8C6" : "#F1F0F0",
          maxWidth: "80%",
          whiteSpace: "pre-wrap",
        }}
      >
        {message.content}
      </span>
    </div>
  );
}
