"use client";

import { useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  useEditorialCandidates,
  useGenerateEditorial,
} from "@/lib/hooks/admin/useEditorialCandidates";
import {
  CandidateTable,
  CandidateTableSkeleton,
} from "@/lib/components/admin/editorial/CandidateTable";
import { Pagination } from "@/lib/components/admin/audit/Pagination";

function EditorialCandidatesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = parseInt(searchParams.get("page") ?? "1", 10);
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const candidatesQuery = useEditorialCandidates({
    page: currentPage,
    perPage: 20,
  });

  const generateMutation = useGenerateEditorial();

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === "") {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      });
      router.replace(`/admin/editorial-candidates?${newParams.toString()}`);
    },
    [searchParams, router]
  );

  const handlePageChange = useCallback(
    (page: number) => {
      updateUrl({ page: page.toString() });
    },
    [updateUrl]
  );

  const handleGenerate = useCallback(
    (postId: string) => {
      setGeneratingId(postId);
      generateMutation.mutate(postId, {
        onSettled: () => {
          setGeneratingId(null);
        },
      });
    },
    [generateMutation]
  );

  const totalPages = candidatesQuery.data
    ? Math.ceil(candidatesQuery.data.total / candidatesQuery.data.per_page)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Editorial Candidates
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Posts eligible for editorial promotion (4+ spots, each with 1+
          solutions)
        </p>
      </div>

      {/* Summary */}
      {candidatesQuery.data && (
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <span className="font-medium text-gray-900 dark:text-gray-100">
            {candidatesQuery.data.total}
          </span>
          eligible posts found
        </div>
      )}

      {/* Error message */}
      {generateMutation.isError && (
        <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-700 dark:text-red-400">
          {generateMutation.error.message}
        </div>
      )}

      {/* Success message */}
      {generateMutation.isSuccess && (
        <div className="rounded-md bg-emerald-50 dark:bg-emerald-900/20 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          Editorial generation started successfully.
        </div>
      )}

      {/* Table */}
      {candidatesQuery.isLoading || candidatesQuery.isError ? (
        <CandidateTableSkeleton />
      ) : candidatesQuery.data ? (
        <>
          <CandidateTable
            data={candidatesQuery.data.data}
            onGenerate={handleGenerate}
            generatingId={generatingId}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </>
      ) : (
        <CandidateTableSkeleton />
      )}
    </div>
  );
}

export default function EditorialCandidatesPage() {
  return (
    <Suspense fallback={<CandidateTableSkeleton />}>
      <EditorialCandidatesContent />
    </Suspense>
  );
}
