import { useEffect, useState } from "react";

export default function InsightsPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/interaction_insights")
      .then((res) => res.json())
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h2>Interaction Insights</h2>
      <p className="mb-4 text-sm text-gray-600">
        Aggregated summary of chat history: counts, frequent prompt terms, and
        average response length.
      </p>
      {error && <p className="text-red-600">Error: {error}</p>}
      {data ? (
        <div className="space-y-4">
          <div>
            <strong>Total interactions:</strong> {data.total_interactions}
          </div>
          <div>
            <strong>Avg. response length:</strong>{" "}
            {data.avg_response_length.toFixed(1)} characters
          </div>
          <div>
            <strong>Top prompt terms:</strong>
            <ol className="list-decimal list-inside">
              {data.top_prompt_terms.map((pair: any, idx: number) => (
                <li key={idx}>
                  {pair[0]} ({pair[1]})
                </li>
              ))}
            </ol>
          </div>
        </div>
      ) : (
        <p>Loading...</p>
      )}
    </main>
  );
}
