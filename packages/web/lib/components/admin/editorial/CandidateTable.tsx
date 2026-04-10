"use client";

import Image from "next/image";
import { Loader2, Sparkles } from "lucide-react";
import type { EditorialCandidateItem } from "@/lib/hooks/admin/useEditorialCandidates";

interface CandidateTableProps {
  data: EditorialCandidateItem[];
  onGenerate: (postId: string) => void;
  generatingId: string | null;
}

export function CandidateTable({
  data,
  onGenerate,
  generatingId,
}: CandidateTableProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No eligible posts found. Posts need 4+ spots with at least 1 solution
          each.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
              Post
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
              Artist / Group
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
              Spots
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
              Solutions
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
              Views
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400">
              Created
            </th>
            <th className="px-4 py-3 text-center font-medium text-gray-500 dark:text-gray-400">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const isGenerating = generatingId === item.id;
            return (
              <tr
                key={item.id}
                className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors"
              >
                {/* Thumbnail + title */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
                      <Image
                        src={item.image_url}
                        alt={item.title ?? "Post image"}
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <span className="truncate max-w-[160px] text-gray-900 dark:text-gray-100">
                      {item.title ?? item.id.slice(0, 8)}
                    </span>
                  </div>
                </td>

                {/* Artist / Group */}
                <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                  <div className="truncate max-w-[140px]">
                    {item.artist_name ?? item.group_name ?? "-"}
                  </div>
                  {item.artist_name && item.group_name && (
                    <div className="text-xs text-gray-400 truncate max-w-[140px]">
                      {item.group_name}
                    </div>
                  )}
                </td>

                {/* Spot count */}
                <td className="px-4 py-3 text-center">
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                    {item.spot_count}
                  </span>
                </td>

                {/* Solution count */}
                <td className="px-4 py-3 text-center">
                  <span className="text-gray-700 dark:text-gray-300">
                    {item.total_solution_count}
                  </span>
                  <span className="ml-1 text-xs text-gray-400">
                    (min {item.min_solutions_per_spot}/spot)
                  </span>
                </td>

                {/* View count */}
                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                  {item.view_count.toLocaleString()}
                </td>

                {/* Created date */}
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  {new Date(item.created_at).toLocaleDateString("ko-KR")}
                </td>

                {/* Generate button */}
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => onGenerate(item.id)}
                    disabled={isGenerating || generatingId !== null}
                    className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                    {isGenerating ? "Generating..." : "Generate"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CandidateTableSkeleton() {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50">
            {[
              "Post",
              "Artist / Group",
              "Spots",
              "Solutions",
              "Views",
              "Created",
              "Action",
            ].map((h) => (
              <th
                key={h}
                className="px-4 py-3 text-left font-medium text-gray-500 dark:text-gray-400"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, i) => (
            <tr
              key={i}
              className="border-b border-gray-100 dark:border-gray-800/50"
            >
              {Array.from({ length: 7 }).map((_, j) => (
                <td key={j} className="px-4 py-3">
                  <div className="h-4 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
