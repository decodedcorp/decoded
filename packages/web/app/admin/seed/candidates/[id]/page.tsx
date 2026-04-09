"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react";
import {
  AdminImagePreview,
  AdminStatusBadge,
} from "@/lib/components/admin/common";
import {
  useCandidate,
  useApproveCandidate,
  useRejectCandidate,
} from "@/lib/api/admin/candidates";

interface CandidateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function CandidateDetailPage({ params }: CandidateDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data, isLoading, isError } = useCandidate(id);
  const approveCandidate = useApproveCandidate();
  const rejectCandidate = useRejectCandidate();

  const candidate = data?.data;

  const handleApprove = () => {
    approveCandidate.mutate(id, {
      onSuccess: () => router.push("/admin/seed/candidates"),
    });
  };

  const handleReject = () => {
    rejectCandidate.mutate(id, {
      onSuccess: () => router.push("/admin/seed/candidates"),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        Loading…
      </div>
    );
  }

  if (isError || !candidate) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3">
        <p className="text-red-400 text-sm">Failed to load candidate.</p>
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-400 hover:text-gray-200"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back */}
      <button
        onClick={() => router.push("/admin/seed/candidates")}
        className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Candidates
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Candidate Detail</h1>
          <p className="text-xs font-mono text-gray-500 mt-1">{candidate.id}</p>
        </div>
        <AdminStatusBadge status={candidate.status} />
      </div>

      {/* Image */}
      <div className="rounded-xl overflow-hidden border border-gray-700 bg-gray-800/50">
        <AdminImagePreview src={candidate.image_url} alt="candidate" size="lg" />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleApprove}
          disabled={approveCandidate.isPending || candidate.status === "ready"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <CheckCircle className="w-4 h-4" />
          {approveCandidate.isPending ? "Approving…" : "Approve"}
        </button>
        <button
          onClick={handleReject}
          disabled={rejectCandidate.isPending || candidate.status === "rejected"}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
        >
          <XCircle className="w-4 h-4" />
          {rejectCandidate.isPending ? "Rejecting…" : "Reject"}
        </button>
      </div>

      {/* Metadata */}
      <div className="rounded-xl border border-gray-700 bg-gray-800/50 divide-y divide-gray-700">
        <MetaRow label="Status" value={<AdminStatusBadge status={candidate.status} />} />
        <MetaRow
          label="Context"
          value={
            candidate.context ? (
              <p className="text-sm text-gray-300 whitespace-pre-wrap">{candidate.context}</p>
            ) : (
              <span className="text-gray-600">—</span>
            )
          }
        />
        <MetaRow
          label="Artist Account ID"
          value={
            candidate.artist_account_id ? (
              <span className="font-mono text-sm text-gray-300">{candidate.artist_account_id}</span>
            ) : (
              <span className="text-gray-600">—</span>
            )
          }
        />
        <MetaRow
          label="Group Account ID"
          value={
            candidate.group_account_id ? (
              <span className="font-mono text-sm text-gray-300">{candidate.group_account_id}</span>
            ) : (
              <span className="text-gray-600">—</span>
            )
          }
        />
        <MetaRow
          label="Source Post ID"
          value={
            candidate.source_post_id ? (
              <span className="font-mono text-sm text-gray-300">{candidate.source_post_id}</span>
            ) : (
              <span className="text-gray-600">—</span>
            )
          }
        />
        <MetaRow
          label="Source Image ID"
          value={
            candidate.source_image_id ? (
              <span className="font-mono text-sm text-gray-300">{candidate.source_image_id}</span>
            ) : (
              <span className="text-gray-600">—</span>
            )
          }
        />
        <MetaRow
          label="Backend Post ID"
          value={
            candidate.backend_post_id ? (
              <span className="font-mono text-sm text-gray-300">{candidate.backend_post_id}</span>
            ) : (
              <span className="text-gray-600">—</span>
            )
          }
        />
        <MetaRow
          label="Created At"
          value={
            <span className="text-sm text-gray-300">
              {new Date(candidate.created_at).toLocaleString()}
            </span>
          }
        />
        <MetaRow
          label="Updated At"
          value={
            <span className="text-sm text-gray-300">
              {new Date(candidate.updated_at).toLocaleString()}
            </span>
          }
        />
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 px-5 py-3.5">
      <span className="text-sm text-gray-500 w-40 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1">{value}</div>
    </div>
  );
}
