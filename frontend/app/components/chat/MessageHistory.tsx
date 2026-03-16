import React from "react";
import ChatMessage from "./ChatMessage";
import type { Message } from "../types";
import { formatChatTimestamp } from "./formatDate";

interface Props {
  history: Message[];
  loading: boolean;
  response: string;
  messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export default function MessageHistory({ history, loading, response, messagesEndRef }: Props) {
  const pendingTimestamp = formatChatTimestamp(new Date().toISOString());

  return (
    <div className="mt-5">
      {history.map((msg, idx) => (
        <ChatMessage key={idx} message={msg} />
      ))}

      {loading && (
        <div className="text-left my-3">
          <div className="text-[11px] text-gray-500 mb-1 pl-1">{pendingTimestamp}</div>
          <span className="inline-block px-4 py-2 rounded-xl bg-gray-100 max-w-[80%] whitespace-pre-wrap">
            {response || "..."}
          </span>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
