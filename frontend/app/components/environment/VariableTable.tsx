import React from "react";
import ModelEntry from "./ModelEntry";

interface Props {
  env: Record<string, any>;
}

export default function VariableTable({ env }: Props) {
  return (
    <div className="overflow-auto">
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr>
            <th className="border px-2 py-1">Variable</th>
            <th className="border px-2 py-1">Value</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(env).map(([k, v]) => (
            <tr key={k}>
              <td className="border px-2 py-1 align-top">{k}</td>
              <td className="border px-2 py-1">
                {k === "models" && Array.isArray(v) ? (
                  <div className="space-y-2">
                    {v.map((item: any, idx: number) => (
                      <ModelEntry key={idx} data={item} />
                    ))}
                  </div>
                ) : Array.isArray(v) ? (
                  <ul className="list-disc list-inside">
                    {v.map((item: any, i: number) => (
                      <li key={i} className="break-words">
                        {typeof item === "object"
                          ? JSON.stringify(item)
                          : String(item)}
                      </li>
                    ))}
                  </ul>
                ) : typeof v === "object" ? (
                  <pre className="whitespace-pre-wrap">
                    {JSON.stringify(v, null, 2)}
                  </pre>
                ) : (
                  String(v)
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
