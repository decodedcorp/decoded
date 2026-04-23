"use client";

import type { AdminMagazineListItem } from "@/lib/api/admin/magazines";
import { MagazineActions } from "./MagazineActions";

interface Props {
  items: AdminMagazineListItem[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onRevert: (id: string) => void;
  mutatingId?: string | null;
}

const STATUS_DOT: Record<AdminMagazineListItem["status"], string> = {
  draft: "bg-gray-400",
  pending: "bg-yellow-400",
  published: "bg-emerald-400",
  rejected: "bg-red-400",
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "—";
  }
}

export function MagazineApprovalTable({
  items,
  onApprove,
  onReject,
  onRevert,
  mutatingId,
}: Props) {
  return (
    <div className="overflow-x-auto border border-gray-200 dark:border-gray-800 rounded-lg">
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/50">
          <tr>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Keyword</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((m) => (
            <tr
              key={m.id}
              className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900/50"
            >
              <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                {m.title || "Untitled"}
                {m.subtitle ? (
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-normal truncate max-w-sm">
                    {m.subtitle}
                  </div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                {m.keyword ?? "—"}
              </td>
              <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {formatDate(m.created_at)}
              </td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 capitalize">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[m.status]}`}
                    aria-hidden="true"
                  />
                  {m.status}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <MagazineActions
                  status={m.status}
                  disabled={mutatingId === m.id}
                  onApprove={() => onApprove(m.id)}
                  onReject={() => onReject(m.id)}
                  onRevert={() => onRevert(m.id)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
