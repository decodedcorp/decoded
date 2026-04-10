"use client";

const SKELETON_ROWS = 10;

export function AdminPostTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-28" />
          <col className="w-20" />
          <col className="w-16" />
          <col className="w-16" />
          <col className="w-24" />
          <col className="w-10" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            {[
              "",
              "Title / Artist",
              "User",
              "Status",
              "Views",
              "Spots",
              "Date",
              "",
            ].map((h, i) => (
              <th
                key={h || `spacer-${i}`}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <tr
              key={i}
              className="border-b border-gray-50 dark:border-gray-800/50"
            >
              <td className="px-3 py-2">
                <div className="w-10 h-10 rounded-md animate-pulse bg-gray-200 dark:bg-gray-800" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 w-32 animate-pulse bg-gray-200 dark:bg-gray-800 rounded mb-1" />
                <div className="h-2.5 w-20 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 w-16 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-5 w-14 animate-pulse bg-gray-200 dark:bg-gray-800 rounded-full" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 w-8 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 w-6 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-3 w-14 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              </td>
              <td className="px-3 py-2">
                <div className="h-4 w-4 animate-pulse bg-gray-200 dark:bg-gray-800 rounded" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
