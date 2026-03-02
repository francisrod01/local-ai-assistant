import React from "react";

interface Props {
  view: "table" | "chart";
  setView: React.Dispatch<React.SetStateAction<"table" | "chart">>;
}

export default function ViewToggle({ view, setView }: Props) {
  return (
    <button
      className="px-3 py-1 bg-blue-600 text-white rounded"
      onClick={() => setView(view === "table" ? "chart" : "table")}
    >
      Switch to {view === "table" ? "chart" : "table"} view
    </button>
  );
}
