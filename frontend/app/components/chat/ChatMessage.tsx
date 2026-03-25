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
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} my-2`}>
      <div className="max-w-[75%]">
        <div
          className={`text-[11px] mb-1 ${isUser ? "text-right text-gray-500" : "text-left text-gray-500"}`}
        >
          {timestamp}
        </div>
        <div
          className={`rounded-2xl px-4 py-3 whitespace-pre-wrap break-words shadow-sm ${isUser
              ? "bg-blue-600 text-white"
              : "bg-white/80 text-slate-900"
            }`}
        >
          {message.content}
        </div>
      </div>
    </div>
  );
}
