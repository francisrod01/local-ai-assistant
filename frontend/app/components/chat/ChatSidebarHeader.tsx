import React from "react";

interface Props {
  onNew: () => void;
}

export default function ChatSidebarHeader({ onNew }: Props) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-2">
        <img
          src="/favicon.ico"
          alt="Local AI Assistant logo"
          className="w-5 h-5 rounded-sm"
        />
        <h2 className="m-0 text-base font-semibold">Chat with AI Assistant</h2>
      </div>

      <button
        type="button"
        aria-label="New conversation"
        title="New conversation"
        onClick={onNew}
        className="inline-flex items-center gap-2 px-2 py-1 rounded border border-gray-200 text-gray-700 hover:text-blue-600 hover:border-blue-200 cursor-pointer text-sm"
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
