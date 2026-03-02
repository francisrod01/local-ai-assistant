// lightweight parser for Prometheus exposition format
export type MetricEntry = {
  name: string;
  labels: Record<string, string>;
  value: number;
};

export type ParsedMetrics = {
  data: MetricEntry[];
  types: Record<string, string>;
};

export function parseMetrics(text: string): ParsedMetrics {
  const lines = text.split("\n");
  const types: Record<string, string> = {};
  const data: MetricEntry[] = [];

  for (let line of lines) {
    if (line.startsWith("# TYPE")) {
      const parts = line.split(" ");
      // '# TYPE metric type'
      if (parts.length >= 4) {
        types[parts[2]] = parts[3];
      }
      continue;
    }
    if (line.startsWith("#") || !line.trim()) continue;

    const [left, valStr] = line.split(" ").filter(Boolean);
    if (!left || valStr === undefined) continue;
    const value = parseFloat(valStr);
    let name = left;
    const labels: Record<string, string> = {};
    const m = left.match(/^([^ {]+)(\{(.+)\})?$/);
    if (m) {
      name = m[1];
      if (m[3]) {
        m[3].split(",").forEach((pair) => {
          const [k, v] = pair.split("=");
          labels[k] = v.replace(/^"|"$/g, "");
        });
      }
    }
    data.push({ name, labels, value });
  }
  return { data, types };
}
