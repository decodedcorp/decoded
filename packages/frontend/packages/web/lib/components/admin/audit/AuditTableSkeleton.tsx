/**
 * Skeleton loading state for the AuditTable.
 * Matches the table structure with animated pulse placeholders.
 */
export function AuditTableSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
      <table className="w-full table-fixed">
        <colgroup>
          <col className="w-16" />
          <col className="w-28" />
          <col className="w-20" />
          <col className="w-36" />
          <col className="hidden sm:table-column w-36" />
        </colgroup>
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800">
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Image
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Status
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Items
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Requested
            </th>
            <th className="hidden sm:table-cell px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Requested By
            </th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }, (_, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 dark:border-gray-800 last:border-0"
            >
              {/* Image skeleton */}
              <td className="px-4 py-3">
                <div className="w-12 h-12 rounded-md bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </td>

              {/* Status skeleton */}
              <td className="px-4 py-3">
                <div className="h-5 w-20 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </td>

              {/* Items skeleton */}
              <td className="px-4 py-3">
                <div className="h-4 w-12 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </td>

              {/* Requested at skeleton */}
              <td className="px-4 py-3">
                <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </td>

              {/* Requested by skeleton (hidden on mobile) */}
              <td className="hidden sm:table-cell px-4 py-3">
                <div className="h-4 w-28 rounded bg-gray-200 dark:bg-gray-800 animate-pulse" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
