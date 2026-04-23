"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Search, Plus, Pencil, Trash2, X, Check, Tag } from "lucide-react";
import {
  AdminDataTable,
  type Column,
  AdminImagePreview,
  AdminPagination,
  AdminEmptyState,
} from "@/lib/components/admin/common";
import {
  useBrandList,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
  type Brand,
} from "@/lib/api/admin/entities";

// ─── Edit / Create Form ───────────────────────────────────────────────────────

interface BrandFormData {
  name_en: string;
  name_ko: string;
  logo_image_url: string;
  primary_instagram_account_id: string;
}

const EMPTY_FORM: BrandFormData = {
  name_en: "",
  name_ko: "",
  logo_image_url: "",
  primary_instagram_account_id: "",
};

interface BrandFormRowProps {
  initial: BrandFormData;
  onSave: (data: BrandFormData) => void;
  onCancel: () => void;
  isSaving: boolean;
}

function BrandFormRow({
  initial,
  onSave,
  onCancel,
  isSaving,
}: BrandFormRowProps) {
  const [form, setForm] = useState(initial);

  const set =
    (key: keyof BrandFormData) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="rounded-xl border border-blue-500/40 bg-gray-800/60 p-4 space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name (EN)</label>
          <input
            value={form.name_en}
            onChange={set("name_en")}
            className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="English name"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Name (KO)</label>
          <input
            value={form.name_ko}
            onChange={set("name_ko")}
            className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="Korean name"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Logo Image URL
          </label>
          <input
            value={form.logo_image_url}
            onChange={set("logo_image_url")}
            className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">
            Instagram Account ID
          </label>
          <input
            value={form.primary_instagram_account_id}
            onChange={set("primary_instagram_account_id")}
            className="w-full rounded-lg bg-gray-700 border border-gray-600 px-3 py-2 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
            placeholder="Account ID"
          />
        </div>
      </div>
      <div className="flex items-center gap-2 justify-end">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors disabled:opacity-50"
        >
          <Check className="w-4 h-4" /> {isSaving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}

// ─── Inner page ───────────────────────────────────────────────────────────────

function BrandsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const currentPage = Number(searchParams.get("page") ?? 1);
  const searchQuery = searchParams.get("search") ?? "";

  const [inputValue, setInputValue] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateUrl = useCallback(
    (params: Record<string, string | undefined>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === "") next.delete(k);
        else next.set(k, v);
      });
      router.replace(`/admin/entities/brands?${next.toString()}`);
    },
    [searchParams, router]
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateUrl({ search: val || undefined, page: "1" });
    }, 300);
  };

  useEffect(() => {
    setInputValue(searchQuery);
  }, [searchQuery]);

  const { data, isLoading, isError } = useBrandList(
    currentPage,
    20,
    searchQuery
  );
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleCreate = (form: BrandFormData) => {
    createBrand.mutate(form, {
      onSuccess: () => setShowCreate(false),
    });
  };

  const handleUpdate = (brand: Brand, form: BrandFormData) => {
    updateBrand.mutate(
      { id: brand.id, ...form },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleDelete = (brand: Brand) => {
    if (!window.confirm(`Delete brand "${brand.name_en ?? brand.name_ko}"?`))
      return;
    deleteBrand.mutate(brand.id);
  };

  const columns: Column<Brand>[] = [
    {
      key: "logo",
      label: "Logo",
      render: (row) =>
        row.logo_image_url ? (
          <AdminImagePreview
            src={row.logo_image_url}
            alt={row.name_en ?? ""}
            size="sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-gray-500 text-xs">
            N/A
          </div>
        ),
    },
    {
      key: "name_en",
      label: "Name (EN)",
      render: (row) => (
        <span className="font-medium text-gray-100">{row.name_en ?? "—"}</span>
      ),
    },
    {
      key: "name_ko",
      label: "Name (KO)",
      render: (row) => (
        <span className="text-gray-300">{row.name_ko ?? "—"}</span>
      ),
    },
    {
      key: "instagram",
      label: "Instagram ID",
      render: (row) =>
        row.primary_instagram_account_id ? (
          <span className="font-mono text-xs text-gray-400">
            {row.primary_instagram_account_id.slice(0, 8)}…
          </span>
        ) : (
          <span className="text-gray-600">—</span>
        ),
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div
          className="flex items-center gap-1 justify-end"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setEditingId(row.id)}
            className="p-1.5 rounded-md text-gray-400 hover:text-gray-200 hover:bg-gray-700 transition-colors"
            aria-label="Edit"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(row)}
            className="p-1.5 rounded-md text-gray-400 hover:text-red-400 hover:bg-gray-700 transition-colors"
            aria-label="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const brands = data?.data ?? [];
  const pagination = data?.pagination;
  const hasFilter = Boolean(searchQuery);
  const isEmpty = !isLoading && !isError && brands.length === 0 && !hasFilter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-100">Brands</h1>
          <p className="text-sm text-gray-400 mt-1">
            Manage warehouse brand entities
            {pagination && (
              <span className="ml-2 text-gray-500">
                ({pagination.total_items} total)
              </span>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreate(true);
            setEditingId(null);
          }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Brand
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={inputValue}
          onChange={handleSearchChange}
          placeholder="Search by name…"
          className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Create form */}
      {showCreate && (
        <BrandFormRow
          initial={EMPTY_FORM}
          onSave={handleCreate}
          onCancel={() => setShowCreate(false)}
          isSaving={createBrand.isPending}
        />
      )}

      {/* Edit form */}
      {editingId &&
        (() => {
          const brand = brands.find((b) => b.id === editingId);
          if (!brand) return null;
          return (
            <BrandFormRow
              initial={{
                name_en: brand.name_en ?? "",
                name_ko: brand.name_ko ?? "",
                logo_image_url: brand.logo_image_url ?? "",
                primary_instagram_account_id:
                  brand.primary_instagram_account_id ?? "",
              }}
              onSave={(form) => handleUpdate(brand, form)}
              onCancel={() => setEditingId(null)}
              isSaving={updateBrand.isPending}
            />
          );
        })()}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-red-800/40 bg-red-900/10 py-12 text-center">
          <p className="text-sm text-red-400">
            Failed to load brands. Please try refreshing the page.
          </p>
        </div>
      )}

      {/* Empty state: no data AND no active filter */}
      {isEmpty && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
          <AdminEmptyState
            icon={<Tag className="w-12 h-12" />}
            title="No brands yet"
            description="Create your first brand entity using the button above."
          />
        </div>
      )}

      {/* Table */}
      {!isError && !isEmpty && (
        <AdminDataTable
          columns={columns}
          data={brands}
          rowKey={(row) => row.id}
          isLoading={isLoading}
          onRowClick={(row) =>
            setEditingId(row.id === editingId ? null : row.id)
          }
          emptyMessage="No brands found"
        />
      )}

      {/* Pagination */}
      {pagination && (
        <AdminPagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={(page) => updateUrl({ page: String(page) })}
        />
      )}
    </div>
  );
}

export default function BrandsPage() {
  return (
    <Suspense
      fallback={<div className="text-gray-400 text-sm p-4">Loading…</div>}
    >
      <BrandsPageContent />
    </Suspense>
  );
}
