import { useRef, useState } from "react";

export function useStreamResponse() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [retryAvailable, setRetryAvailable] = useState(false);
  const abortController = useRef<AbortController | null>(null);


  const sendPrompt = async (prompt: string) => {
    setLoading(true);
    setResponse("");
    setError(null);
    setRetryAvailable(false);

    abortController.current = new AbortController();

    try {
      const res = await fetch("/chat_stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
        signal: abortController.current.signal,
      });

      if (!res.body) throw new Error("No response body from server");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      async function* streamChunks() {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          yield decoder.decode(value, { stream: true });
        }
      }

      for await (const chunk of streamChunks()) {
        setResponse((prev) => prev + chunk);
      }
    } catch (err: any) {
      setError(err.message || "Streaming failed");

      // Show retry button after 5 seconds
      setTimeout(() => setRetryAvailable(true), 5000);
    } finally {
      setLoading(false);
    }
  };

  const cancelPrompt = () => {
    abortController.current?.abort();
    setLoading(false);
  };

  return { response, loading, error, retryAvailable, sendPrompt, cancelPrompt };
}
