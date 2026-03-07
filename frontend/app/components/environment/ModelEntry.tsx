import { useEffect, useRef, useState } from "react";

type ModelData = Record<string, any>;

export default function ModelEntry({ data }: { data: ModelData }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const jsonStr = JSON.stringify(data, null, 2);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonStr);
      setCopied(true);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
        setCopied(false);
      }, 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="border p-2 rounded">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            aria-label={expanded ? "Collapse model details" : "Expand model details"}
            className="inline-flex h-6 w-6 items-center justify-center rounded border text-gray-700 hover:bg-gray-100"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "▼" : "▶"}
          </button>
          <span className="font-medium truncate">
            {data.name || data.model || "(unknown)"}
          </span>
        </div>
        <button
          type="button"
          title={copied ? "Copied to clipboard" : "Copy model details"}
          aria-label={copied ? "Copied to clipboard" : "Copy model details"}
          className="inline-flex items-center rounded border px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100"
          onClick={copyToClipboard}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      {expanded && (
        <pre className="whitespace-pre-wrap mt-2 bg-gray-100 p-2 rounded text-xs">
          {jsonStr}
        </pre>
      )}
    </div>
  );
}
