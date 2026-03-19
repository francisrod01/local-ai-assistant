import type { RefObject } from "react";
import type { Conversation } from "../components/types";

export interface ChatViewProps {
  prompt: string;
  setPrompt: (v: string) => void;
  savedConversations: Conversation[];
  selectedConversationId: string | null;
  response: string;
  loading: boolean;
  error: string | null;
  retryAvailable: boolean;
  cancelPrompt: () => void;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  handleSend: () => void;
  handleRetry: () => void;
  openConversation: (c: Conversation) => void;
  deleteConversation: (id: string) => void;
  clearHistory: () => Promise<void>;
  newConversation: () => void;
  lastSentPrompt: string | null;
}
