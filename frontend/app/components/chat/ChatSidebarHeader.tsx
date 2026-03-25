import React from "react";

interface Props {
  onNew: () => void;
}

export default function ChatSidebarHeader({ onNew }: Props) {
  return (
    <div className="mb-3">
      <div className="mb-2">
        <h2 className="text-base font-semibold">Chat with AI Assistant</h2>
        <p className="text-xs text-gray-500">
          Smart chat area: fully integrated with task history and assistant memory.
        </p>
      </div>

      <button
        type="button"
        aria-label="New conversation"
        title="New conversation"
        onClick={onNew}
        className="inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-100 text-gray-700 hover:text-blue-600 hover:bg-gray-200 cursor-pointer text-sm"
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
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2" />
          <line x1="18" y1="8" x2="18" y2="14" />
          <line x1="15" y1="11" x2="21" y2="11" />
        </svg>
        New chat
      </button>
    </div>
  );
}
