import React from "react";
import type { Message } from "../types";
import { formatChatTimestamp } from "./formatDate";

interface Props {
  message: Message;
}

export default function ChatMessage({ message }: Props) {
  const isUser = message.role === "user";
  const timestamp = formatChatTimestamp(message.createdAt);

  return (
    <div className={`${isUser ? "text-right" : "text-left"} my-3`}>
      <div
        className={`text-[11px] text-gray-500 mb-1 ${isUser ? "text-right pr-1" : "text-left pl-1"}`}
      >
        {timestamp}
      </div>
      <span
        className={`inline-block px-4 py-2 rounded-xl max-w-[80%] whitespace-pre-wrap ${isUser ? "bg-green-100" : "bg-gray-100"
          }`}
      >
        {message.content}
      </span>
    </div>
  );
}
