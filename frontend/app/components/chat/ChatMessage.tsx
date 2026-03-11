import React from "react";
import type { Message } from "./types";

interface Props {
  message: Message;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`${isUser ? "text-right" : "text-left"} my-2`}>
      <span
        className={`inline-block px-4 py-2 rounded-xl max-w-[80%] whitespace-pre-wrap ${isUser ? "bg-green-100" : "bg-gray-100"
          }`}
      >
        {message.content}
      </span>
    </div>
  );
}
