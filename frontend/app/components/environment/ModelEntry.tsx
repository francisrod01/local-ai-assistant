import { useState } from "react";

type ModelData = Record<string, any>;

export default function ModelEntry({ data }: { data: ModelData }) {
  const [expanded, setExpanded] = useState(false);
  const jsonStr = JSON.stringify(data, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonStr).catch(() => {});
  };

  return (
    <div className="border p-2 rounded">
      <div className="flex items-center justify-between">
        <span className="font-medium">
          {data.name || data.model || "(unknown)"}
        </span>
        <div className="flex gap-2">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setExpanded((e) => !e)}
          >
            {expanded ? "–" : "+"}
          </button>
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={copyToClipboard}
          >
            copy
          </button>
        </div>
      </div>
      {expanded && (
        <pre className="whitespace-pre-wrap mt-2 bg-gray-100 p-2 rounded text-xs">
          {jsonStr}
        </pre>
      )}
    </div>
  );
}
