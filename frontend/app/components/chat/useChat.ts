import { useEffect, useRef, useState } from "react";
import { useStreamResponse } from "../../hooks/useStreamResponse";

import type { Message, Conversation } from "../types";

// shape returned from the backend
export type InteractionOut = {
  id: number;
  prompt: string;
  response: string;
  user: string;
  conversation_id?: string | null;
  created_at: string;
};

export function useChat() {
  const [prompt, setPrompt] = useState("");
  const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [pendingConversationId, setPendingConversationId] = useState<string | null>(null);
  const [lastSentPrompt, setLastSentPrompt] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  const { response, loading, error, retryAvailable, sendPrompt, cancelPrompt } = useStreamResponse();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const shortText = (text: string, maxLen: number) => {
    const cleaned = (text || "").trim().replace(/\s+/g, " ");
    if (!cleaned) return "Untitled";
    if (cleaned.length <= maxLen) return cleaned;
    return `${cleaned.slice(0, maxLen - 1)}…`;
  };

  const summarizeConversation = (messages: Message[]) => {
    const userMessages = messages.filter((m) => m.role === "user");
    const firstQuestion = userMessages[0]?.content ?? "Untitled";
    const latestQuestion = userMessages[userMessages.length - 1]?.content ?? firstQuestion;
    const turns = userMessages.length;

    return {
      title: shortText(firstQuestion, 52),
      description: `${turns} question${turns === 1 ? "" : "s"} • ${shortText(latestQuestion, 80)}`,
    };
  };

  const upsertConversation = (
    conversationId: string,
    updater: (existing?: Conversation) => Conversation,
  ) => {
    setSavedConversations((prev) => {
      const existing = prev.find((c) => c.id === conversationId);
      const nextConversation = updater(existing);
      const withoutCurrent = prev.filter((c) => c.id !== conversationId);
      // Keep the most recently updated conversation at the top.
      return [nextConversation, ...withoutCurrent];
    });
  };

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/history");
        if (!res.ok) throw new Error("failed to fetch history");
        const data: InteractionOut[] = await res.json();
        const grouped = new Map<string, InteractionOut[]>();

        for (const item of data) {
          const key = item.conversation_id || `legacy-${item.id}`;
          const list = grouped.get(key);
          if (list) {
            list.push(item);
          } else {
            grouped.set(key, [item]);
          }
        }

        const conversations: Conversation[] = [];

        for (const [conversationId, rows] of grouped.entries()) {
          const sortedRows = [...rows].sort(
            (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
          );

          const messages: Message[] = [];
          for (const row of sortedRows) {
            messages.push({ role: "user", content: row.prompt, createdAt: row.created_at });
            messages.push({ role: "assistant", content: row.response, createdAt: row.created_at });
          }

          const summary = summarizeConversation(messages);
          const latestCreatedAt = sortedRows[sortedRows.length - 1]?.created_at ?? new Date().toISOString();

          conversations.push({
            id: conversationId,
            title: summary.title,
            description: summary.description,
            messages,
            interactionIds: sortedRows.map((r) => r.id),
            updatedAt: latestCreatedAt,
          });
        }

        conversations.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );

        setSavedConversations(conversations);
        if (conversations.length > 0) {
          setSelectedConversationId(conversations[0].id);
        }
      } catch (err) {
        console.error("could not load conversation history", err);
      }
    }

    loadHistory();
  }, []);

  const handleSend = () => {
    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || loading) return;

    const conversationId = selectedConversationId || `conv-${crypto.randomUUID()}`;
    const existingConversation = savedConversations.find((c) => c.id === conversationId);
    const existingMessages = existingConversation?.messages ?? [];
    const createdAt = new Date().toISOString();

    const userMsg: Message = { role: "user", content: trimmedPrompt, createdAt };
    const nextMessages = [...existingMessages, userMsg];
    const summary = summarizeConversation(nextMessages);

    upsertConversation(conversationId, (existing) => ({
      id: conversationId,
      title: summary.title,
      description: summary.description,
      messages: nextMessages,
      interactionIds: existing?.interactionIds ?? [],
      updatedAt: new Date().toISOString(),
    }));

    setPendingPrompt(trimmedPrompt);
    setPendingConversationId(conversationId);
    setLastSentPrompt(trimmedPrompt);

    sendPrompt(trimmedPrompt, {
      user: "user_1",
      conversationId,
      context: existingMessages,
    });
    setPrompt("");
    setSelectedConversationId(conversationId);
  };

  useEffect(() => {
    if (!loading && response && pendingPrompt && pendingConversationId) {
      const assistantMsg: Message = {
        role: "assistant",
        content: response,
        createdAt: new Date().toISOString(),
      };
      upsertConversation(pendingConversationId, (existing) => {
        const baseMessages = existing?.messages ?? [
          { role: "user", content: pendingPrompt, createdAt: new Date().toISOString() },
        ];
        const nextMessages = [...baseMessages, assistantMsg];
        const summary = summarizeConversation(nextMessages);

        return {
          id: pendingConversationId,
          title: summary.title,
          description: summary.description,
          messages: nextMessages,
          interactionIds: existing?.interactionIds ?? [],
          updatedAt: new Date().toISOString(),
        };
      });

      setPendingPrompt(null);
      setPendingConversationId(null);
    }
  }, [loading, response, pendingPrompt, pendingConversationId]);

  const openConversation = (conv: Conversation) => {
    setSelectedConversationId(conv.id);
  };

  const handleRetry = () => {
    if (!lastSentPrompt) return;
    if (loading) return;

    const conversationId = selectedConversationId || `conv-${crypto.randomUUID()}`;
    const existingConversation = savedConversations.find((c) => c.id === conversationId);
    const existingMessages = existingConversation?.messages ?? [];
    const userMsg: Message = {
      role: "user",
      content: lastSentPrompt,
      createdAt: new Date().toISOString(),
    };
    const nextMessages = [...existingMessages, userMsg];
    const summary = summarizeConversation(nextMessages);

    upsertConversation(conversationId, (existing) => ({
      id: conversationId,
      title: summary.title,
      description: summary.description,
      messages: nextMessages,
      interactionIds: existing?.interactionIds ?? [],
      updatedAt: new Date().toISOString(),
    }));

    setPendingConversationId(conversationId);
    setPendingPrompt(lastSentPrompt);
    sendPrompt(lastSentPrompt, {
      user: "user_1",
      conversationId,
      context: existingMessages,
    });
    setSelectedConversationId(conversationId);
  };

  const clearHistory = async () => {
    try {
      await fetch("/history", { method: "DELETE" });
    } catch (err) {
      console.error("failed to clear history", err);
    }
    setSavedConversations([]);
    setSelectedConversationId(null);
    setPrompt("");
    setLastSentPrompt(null);
    setPendingPrompt(null);
    setPendingConversationId(null);
  };

  const deleteConversation = async (id: string) => {
    const previous = savedConversations;
    const target = previous.find((c) => c.id === id);
    if (!target) return;

    // Optimistically remove the conversation from the UI so the user can continue.
    setSavedConversations((prev) => prev.filter((c) => c.id !== id));

    if (selectedConversationId === id) {
      setSelectedConversationId(null);
      setPrompt("");
      setLastSentPrompt(null);
      setPendingPrompt(null);
      setPendingConversationId(null);
      cancelPrompt();
    }

    try {
      const endpoint = id.startsWith("legacy-")
        ? `/history/${target.interactionIds[0]}`
        : `/history/conversation/${encodeURIComponent(id)}`;
      const res = await fetch(endpoint, { method: "DELETE" });
      if (!res.ok) throw new Error("failed to delete conversation");
    } catch (err) {
      console.error("failed to delete conversation", err);
      setSavedConversations(previous);
    }
  };

  const newConversation = () => {
    setSelectedConversationId(null);
    setPrompt("");
    setLastSentPrompt(null);
    setPendingPrompt(null);
    setPendingConversationId(null);
    cancelPrompt();
  };

  return {
    prompt,
    setPrompt,
    savedConversations,
    selectedConversationId,
    response,
    loading,
    error,
    retryAvailable,
    sendPrompt,
    cancelPrompt,
    messagesEndRef,
    handleSend,
    handleRetry,
    openConversation,
    deleteConversation,
    clearHistory,
    newConversation,
    lastSentPrompt,
  };
}
