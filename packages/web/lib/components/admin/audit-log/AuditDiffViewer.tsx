"use client";

import { cn } from "@/lib/utils";

interface AuditDiffViewerProps {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}

export function AuditDiffViewer({ before, after }: AuditDiffViewerProps) {
  if (!before && !after) {
    return <p className="text-sm text-gray-500">No state data available</p>;
  }

  const allKeys = new Set([
    ...Object.keys(before ?? {}),
    ...Object.keys(after ?? {}),
  ]);

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 overflow-hidden">
      <table className="w-full text-xs font-mono">
        <thead className="bg-gray-50 dark:bg-gray-900">
          <tr>
            <th className="px-3 py-2 text-left text-gray-500 font-medium">
              Field
            </th>
            <th className="px-3 py-2 text-left text-gray-500 font-medium">
              Before
            </th>
            <th className="px-3 py-2 text-left text-gray-500 font-medium">
              After
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...allKeys].sort().map((key) => {
            const b = before?.[key];
            const a = after?.[key];
            const bStr = b !== undefined ? JSON.stringify(b) : "—";
            const aStr = a !== undefined ? JSON.stringify(a) : "—";
            const changed = bStr !== aStr;
            return (
              <tr
                key={key}
                className={cn(changed && "bg-yellow-50 dark:bg-yellow-900/10")}
              >
                <td className="px-3 py-1.5 text-gray-600 dark:text-gray-400 font-medium">
                  {key}
                </td>
                <td
                  className={cn(
                    "px-3 py-1.5 max-w-[300px] truncate",
                    changed && "text-red-600 dark:text-red-400"
                  )}
                >
                  {bStr}
                </td>
                <td
                  className={cn(
                    "px-3 py-1.5 max-w-[300px] truncate",
                    changed && "text-green-600 dark:text-green-400"
                  )}
                >
                  {aStr}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
