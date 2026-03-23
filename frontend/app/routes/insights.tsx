import { useEffect, useState } from "react";

import { createPageTitle } from "../utils/meta";
import PageHeader from "../components/PageHeader";

export function meta() {
  return createPageTitle("Insights");
}

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
    <main className="pt-[30px] p-4 container mx-auto">
      <PageHeader
        title="Interaction Insights"
        description="A snapshot of aggregated chat usage and analytics."
      />
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
