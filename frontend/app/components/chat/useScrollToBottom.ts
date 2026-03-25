import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";

export function useScrollToBottom({
  activeConversationId,
  messagesLength,
  response,
  loading,
  messagesEndRef,
}: {
  activeConversationId: string | null;
  messagesLength: number;
  response: string;
  loading: boolean;
  messagesEndRef: RefObject<HTMLDivElement | null>;
}) {
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;

    const SCROLL_BOTTOM_THRESHOLD = 24;

    const handleScroll = () => {
      const isAtBottom = el.scrollHeight - el.scrollTop - el.clientHeight < SCROLL_BOTTOM_THRESHOLD;
      setShowScrollToBottom(!isAtBottom);
    };

    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [activeConversationId]);

  useEffect(() => {
    const endEl = messagesEndRef.current;
    if (!endEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowScrollToBottom(!entry.isIntersecting);
      },
      {
        root: messagesContainerRef.current,
        threshold: 0.5,
      }
    );

    observer.observe(endEl);
    return () => observer.disconnect();
  }, [messagesEndRef]);

  useEffect(() => {
    // Auto-scroll to bottom unless the user has scrolled up.
    if (!showScrollToBottom) {
      scrollToBottom();
    }
  }, [messagesLength, response, loading, showScrollToBottom]);

  useEffect(() => {
    // When switching conversations, immediately scroll to the bottom
    setShowScrollToBottom(false);
    scrollToBottom();
  }, [activeConversationId]);

  return { messagesContainerRef, showScrollToBottom, scrollToBottom };
}
