import React from "react";

interface Props {
  view: "table" | "chart";
  setView: React.Dispatch<React.SetStateAction<"table" | "chart">>;
}

export default function ViewToggle({ view, setView }: Props) {
  return (
    <div className="inline-flex overflow-hidden rounded border bg-white">
      <button
        type="button"
        className={`px-3 py-1.5 text-sm ${
          view === "table"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
        onClick={() => setView("table")}
        aria-pressed={view === "table"}
      >
        ▦ Table
      </button>
      <button
        type="button"
        className={`border-l px-3 py-1.5 text-sm ${
          view === "chart"
            ? "bg-blue-600 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
        onClick={() => setView("chart")}
        aria-pressed={view === "chart"}
      >
        📈 Chart
      </button>
    </div>
  );
}
