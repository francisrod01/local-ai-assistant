import { useEffect, useRef, useState } from "react";
import { useStreamResponse } from "../../hooks/useStreamResponse";

import type { Message, Conversation } from "../types";

// shape returned from the backend
export type InteractionOut = {
  id: number;
  prompt: string;
  response: string;
  user: string;
  created_at: string;
};

export function useChat() {
  const [prompt, setPrompt] = useState("");
  const [history, setHistory] = useState<Message[]>([]);
  const [savedConversations, setSavedConversations] = useState<Conversation[]>([]);

  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [lastSentPrompt, setLastSentPrompt] = useState<string | null>(null);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);

  const { response, loading, error, retryAvailable, sendPrompt, cancelPrompt } = useStreamResponse();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const getTitleFromPrompt = (text: string) =>
    text.trim().split(/\s+/).slice(0, 10).join(" ") || "Untitled";

  useEffect(() => {
    async function loadHistory() {
      try {
        const res = await fetch("/history");
        if (!res.ok) throw new Error("failed to fetch history");
        const data: InteractionOut[] = await res.json();
        const convs: Conversation[] = data.map((item) => ({
          id: item.id,
          title: getTitleFromPrompt(item.prompt),
          messages: [
            { role: "user", content: item.prompt },
            { role: "assistant", content: item.response },
          ],
        }));
        setSavedConversations(convs);
      } catch (err) {
        console.error("could not load conversation history", err);
      }
    }

    loadHistory();
  }, []);

  const handleSend = () => {
    if (!prompt.trim()) return;

    const userMsg: Message = { role: "user", content: prompt };
    setHistory((prev) => [...prev, userMsg]);

    setPendingPrompt(prompt);
    setLastSentPrompt(prompt);

    sendPrompt(prompt);
    setPrompt("");
    setSelectedConversationId(null);
  };

  useEffect(() => {
    if (!loading && response && pendingPrompt) {
      const assistantMsg: Message = { role: "assistant", content: response };
      setHistory((prev) => [...prev, assistantMsg]);

      const title = getTitleFromPrompt(pendingPrompt);

      (async () => {
        try {
          const res = await fetch("/history", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: pendingPrompt, response, user: "user_1" }),
          });
          const saved: InteractionOut = await res.json();
          const conv: Conversation = {
            id: saved.id,
            title,
            messages: [
              { role: "user", content: pendingPrompt },
              { role: "assistant", content: response },
            ],
          };
          setSavedConversations((prev) => [conv, ...prev]);
        } catch (err) {
          console.error("failed to persist conversation", err);
          const conv: Conversation = {
            id: Date.now(),
            title,
            messages: [
              { role: "user", content: pendingPrompt },
              { role: "assistant", content: response },
            ],
          };
          setSavedConversations((prev) => [conv, ...prev]);
        }
      })();

      setPendingPrompt(null);
    }
  }, [loading, response, pendingPrompt]);

  const openConversation = (conv: Conversation) => {
    setSelectedConversationId(conv.id);
  };

  const handleRetry = () => {
    if (!lastSentPrompt) return;
    setHistory((prev) => [...prev, { role: "user", content: lastSentPrompt }]);
    setPendingPrompt(lastSentPrompt);
    sendPrompt(lastSentPrompt);
  };

  const clearHistory = async () => {
    try {
      await fetch("/history", { method: "DELETE" });
    } catch (err) {
      console.error("failed to clear history", err);
    }
    setSavedConversations([]);
    setSelectedConversationId(null);
  };

  const newConversation = () => {
    setHistory([]);
    setSelectedConversationId(null);
    setLastSentPrompt(null);
    cancelPrompt();
  };

  return {
    prompt,
    setPrompt,
    history,
    savedConversations,
    selectedConversationId,
    getTitleFromPrompt,
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
    clearHistory,
    newConversation,
    lastSentPrompt,
  };
}
