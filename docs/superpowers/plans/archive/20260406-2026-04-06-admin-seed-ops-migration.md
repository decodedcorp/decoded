# Admin Seed-Ops Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** seed-ops 전체 기능을 모노레포 admin으로 마이그레이션하고, 벌크 액션/Audit Log/변경 이력 추가 기능을 구현한다.

**Architecture:** 하이브리드 데이터 접근 (읽기=Supabase 직접 warehouse, 쓰기=Next.js API Routes + service_role). 기존 admin 패턴(React Query + client components + URL state) 유지. decoded.pen 디자인 시스템으로 재작성.

**Tech Stack:** Next.js 16 / React 19 / TypeScript / Supabase (warehouse schema) / TanStack Query 5 / Tailwind / Lucide Icons

**Spec:** `docs/superpowers/specs/2026-04-06-admin-seed-ops-migration-design.md`
**Branch:** `feat/admin-seed-ops-migration`
**Issues:** #101 (parent), #107 (Phase 0), #108 (Phase 1), #109 (Phase 2), #110 (Phase 3)

**Note:** Admin 로그인은 이미 이메일/패스워드로 구현됨 — Auth 변경 불필요.

---

## File Structure

### 공통 컴포넌트 (Phase 0)

```
packages/web/lib/components/admin/common/
  AdminDataTable.tsx          # 범용 테이블 (정렬/필터/페이지네이션/벌크 선택)
  AdminStatusBadge.tsx        # 상태 뱃지 (draft/approved/rejected 등)
  AdminBulkActionBar.tsx      # 벌크 액션 툴바
  AdminDetailPanel.tsx        # 슬라이드 오버 상세 패널
  AdminImagePreview.tsx       # 이미지 프리뷰 (외부 URL)
```

### 사이드바 수정 (Phase 0)

```
packages/web/lib/components/admin/AdminSidebar.tsx  # 그룹 네비게이션 추가
```

### Audit Log (Phase 0 DDL + Phase 3 UI)

```
packages/web/lib/api/admin/audit-log.ts             # audit log 유틸리티
packages/web/app/api/admin/audit-log/route.ts       # GET: 로그 조회
```

### 엔티티 관리 (Phase 1)

```
packages/web/app/admin/entities/artists/page.tsx
packages/web/app/admin/entities/brands/page.tsx
packages/web/app/admin/entities/group-members/page.tsx
packages/web/app/api/admin/entities/artists/route.ts
packages/web/app/api/admin/entities/artists/[id]/route.ts
packages/web/app/api/admin/entities/brands/route.ts
packages/web/app/api/admin/entities/brands/[id]/route.ts
packages/web/app/api/admin/entities/group-members/route.ts
packages/web/lib/api/admin/entities.ts               # React Query hooks
```

### Seed 파이프라인 (Phase 2)

```
packages/web/app/admin/seed/candidates/page.tsx
packages/web/app/admin/seed/candidates/[id]/page.tsx
packages/web/app/admin/seed/post-images/page.tsx
packages/web/app/admin/seed/post-spots/page.tsx
packages/web/app/admin/review/page.tsx
packages/web/app/api/admin/candidates/route.ts
packages/web/app/api/admin/candidates/[id]/route.ts
packages/web/app/api/admin/candidates/[id]/approve/route.ts
packages/web/app/api/admin/candidates/[id]/reject/route.ts
packages/web/app/api/admin/candidates/[id]/source/route.ts
packages/web/app/api/admin/post-images/route.ts
packages/web/app/api/admin/post-spots/route.ts
packages/web/app/api/admin/review/route.ts
packages/web/lib/api/admin/candidates.ts
packages/web/lib/api/admin/seed.ts
```

### 추가 기능 (Phase 3)

```
packages/web/app/admin/audit-log/page.tsx
packages/web/app/api/admin/bulk/route.ts
packages/web/lib/api/admin/bulk.ts
packages/web/lib/components/admin/audit-log/AuditLogTable.tsx
packages/web/lib/components/admin/audit-log/AuditDiffViewer.tsx
```

---

## Phase 0: 공통 기반 (순차) — Issue #107

### Task 1: 사이드바 그룹 네비게이션

**Files:**
- Modify: `packages/web/lib/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: NavItem 타입에 그룹 지원 추가**

`AdminSidebar.tsx`의 `NavItem` 인터페이스와 `NAV_ITEMS` 배열을 그룹 구조로 변경:

```typescript
interface NavGroup {
  label: string;
  items: NavItem[];
}

type SidebarEntry = NavItem | NavGroup;

function isNavGroup(entry: SidebarEntry): entry is NavGroup {
  return "items" in entry;
}

const SIDEBAR_ENTRIES: SidebarEntry[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/content", label: "Content", icon: FileText },
  { href: "/admin/editorial-candidates", label: "Editorial", icon: Sparkles },
  { href: "/admin/picks", label: "Decoded Pick", icon: Star },
  {
    label: "Seed Pipeline",
    items: [
      { href: "/admin/seed/candidates", label: "Candidates", icon: Users },
      { href: "/admin/seed/post-images", label: "Post Images", icon: Image },
      { href: "/admin/seed/post-spots", label: "Post Spots", icon: MapPin },
      { href: "/admin/review", label: "Review Queue", icon: CheckCircle },
    ],
  },
  {
    label: "Entities",
    items: [
      { href: "/admin/entities/artists", label: "Artists", icon: Mic2 },
      { href: "/admin/entities/brands", label: "Brands", icon: Tag },
      { href: "/admin/entities/group-members", label: "Groups", icon: UsersRound },
    ],
  },
  { href: "/admin/audit-log", label: "Audit Log", icon: History },
  { href: "/admin/ai-audit", label: "AI Audit", icon: ScanSearch },
  { href: "/admin/ai-cost", label: "AI Cost", icon: DollarSign },
  { href: "/admin/pipeline-logs", label: "Pipeline Logs", icon: GitBranch },
  { href: "/admin/server-logs", label: "Server Logs", icon: Server },
];
```

- [ ] **Step 2: 사이드바 렌더링에 그룹 지원 추가**

`<nav>` 내부의 `<ul>` 렌더링을 그룹 구조로 변경:

```tsx
<ul className="space-y-0.5 px-2">
  {SIDEBAR_ENTRIES.map((entry, idx) => {
    if (isNavGroup(entry)) {
      return (
        <li key={entry.label} className="mt-4 first:mt-0">
          <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
            {entry.label}
          </p>
          <ul className="space-y-0.5">
            {entry.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} pathname={pathname} onClose={onClose} />
              </li>
            ))}
          </ul>
        </li>
      );
    }
    return (
      <li key={entry.href}>
        <NavLink item={entry} pathname={pathname} onClose={onClose} />
      </li>
    );
  })}
</ul>
```

NavLink을 별도 컴포넌트로 추출:

```tsx
function NavLink({ item, pathname, onClose }: { item: NavItem; pathname: string; onClose: () => void }) {
  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors border-l-2",
        active
          ? "bg-gray-800 text-white border-blue-500 font-medium"
          : "text-gray-400 border-transparent hover:bg-gray-800/60 hover:text-gray-200"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="w-4 h-4 flex-shrink-0" />
      {item.label}
    </Link>
  );
}
```

- [ ] **Step 3: lucide-react import 추가**

```typescript
import {
  ArrowLeft, LayoutDashboard, FileText, ScanSearch, DollarSign,
  GitBranch, Server, Sparkles, Star, LogOut,
  // NEW
  Users, Image, MapPin, CheckCircle, Mic2, Tag, UsersRound, History,
} from "lucide-react";
```

- [ ] **Step 4: 브라우저에서 사이드바 확인**

Run: `cd packages/web && bun dev`
Expected: 사이드바에 "Seed Pipeline", "Entities" 그룹이 표시되고, 각 하위 항목이 들여쓰기되어 보임. 새 라우트 클릭 시 404 (아직 페이지 미구현) — 정상.

- [ ] **Step 5: 커밋**

```bash
git add packages/web/lib/components/admin/AdminSidebar.tsx
git commit -m "feat(admin): add grouped sidebar navigation for seed pipeline and entities (#107)"
```

---

### Task 2: AdminStatusBadge 공통 컴포넌트

**Files:**
- Create: `packages/web/lib/components/admin/common/AdminStatusBadge.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
import { cn } from "@/lib/utils";

type BadgeVariant = "draft" | "approved" | "rejected" | "pending" | "active" | "hidden" | "deleted" | "error";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  draft: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  deleted: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  error: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  hidden: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

interface AdminStatusBadgeProps {
  status: string;
  className?: string;
}

export function AdminStatusBadge({ status, className }: AdminStatusBadgeProps) {
  const variant = (status in VARIANT_STYLES ? status : "draft") as BadgeVariant;
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-xs font-medium rounded-full capitalize",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {status}
    </span>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/components/admin/common/AdminStatusBadge.tsx
git commit -m "feat(admin): add AdminStatusBadge common component (#107)"
```

---

### Task 3: AdminDataTable 범용 테이블 컴포넌트

**Files:**
- Create: `packages/web/lib/components/admin/common/AdminDataTable.tsx`

- [ ] **Step 1: 타입 정의와 컴포넌트 구현**

```tsx
"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
}

interface AdminDataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string, dir: "asc" | "desc") => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  skeletonRows?: number;
}

export function AdminDataTable<T>({
  columns,
  data,
  rowKey,
  selectable = false,
  selectedIds,
  onSelectionChange,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = "No data found",
  isLoading = false,
  skeletonRows = 5,
}: AdminDataTableProps<T>) {
  const allIds = data.map(rowKey);
  const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds?.has(id));

  const toggleAll = useCallback(() => {
    if (!onSelectionChange) return;
    if (allSelected) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(allIds));
    }
  }, [allIds, allSelected, onSelectionChange]);

  const toggleOne = useCallback(
    (id: string) => {
      if (!onSelectionChange || !selectedIds) return;
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      onSelectionChange(next);
    },
    [selectedIds, onSelectionChange]
  );

  const handleSort = (key: string) => {
    if (!onSort) return;
    const nextDir = sortKey === key && sortDir === "asc" ? "desc" : "asc";
    onSort(key, nextDir);
  };

  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-900 text-left">
            <tr>
              {selectable && <th className="w-10 px-3 py-3" />}
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i}>
                {selectable && <td className="px-3 py-3"><div className="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" /></td>}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 py-12 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 dark:bg-gray-900 text-left">
          <tr>
            {selectable && (
              <th className="w-10 px-3 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="rounded border-gray-300 dark:border-gray-600"
                  aria-label="Select all"
                />
              </th>
            )}
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500",
                  col.sortable && "cursor-pointer select-none hover:text-gray-700 dark:hover:text-gray-300",
                  col.className
                )}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    sortDir === "asc" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
                  )}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-950">
          {data.map((row, i) => {
            const id = rowKey(row);
            return (
              <tr
                key={id}
                className={cn(
                  "transition-colors",
                  onRowClick && "cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-900",
                  selectedIds?.has(id) && "bg-blue-50 dark:bg-blue-900/20"
                )}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds?.has(id) ?? false}
                      onChange={() => toggleOne(id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                      aria-label={`Select row ${id}`}
                    />
                  </td>
                )}
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-4 py-3", col.className)}>
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/components/admin/common/AdminDataTable.tsx
git commit -m "feat(admin): add AdminDataTable generic table component (#107)"
```

---

### Task 4: AdminBulkActionBar 컴포넌트

**Files:**
- Create: `packages/web/lib/components/admin/common/AdminBulkActionBar.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BulkAction {
  key: string;
  label: string;
  variant?: "default" | "danger";
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  loading?: boolean;
}

interface AdminBulkActionBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClearSelection: () => void;
}

export function AdminBulkActionBar({
  selectedCount,
  actions,
  onClearSelection,
}: AdminBulkActionBarProps) {
  if (selectedCount === 0) return null;

  return (
    <div className="sticky bottom-4 z-30 mx-auto w-fit animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2.5 shadow-lg">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedCount} selected
        </span>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-700" />

        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              onClick={action.onClick}
              disabled={action.loading}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50",
                action.variant === "danger"
                  ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                  : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
              )}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {action.loading ? "..." : action.label}
            </button>
          );
        })}

        <button
          onClick={onClearSelection}
          className="ml-1 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          aria-label="Clear selection"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/components/admin/common/AdminBulkActionBar.tsx
git commit -m "feat(admin): add AdminBulkActionBar component (#107)"
```

---

### Task 5: AdminImagePreview 컴포넌트

**Files:**
- Create: `packages/web/lib/components/admin/common/AdminImagePreview.tsx`

- [ ] **Step 1: 컴포넌트 구현**

```tsx
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminImagePreviewProps {
  src: string;
  alt?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: "w-10 h-10",
  md: "w-20 h-20",
  lg: "w-40 h-40",
};

export function AdminImagePreview({ src, alt = "", size = "sm", className }: AdminImagePreviewProps) {
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={cn(SIZES[size], "rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 text-xs", className)}>
        N/A
      </div>
    );
  }

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className={cn(SIZES[size], "rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity", className)}
        onClick={() => setExpanded(true)}
        onError={() => setError(true)}
      />
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
          onClick={() => setExpanded(false)}
        >
          <button
            onClick={() => setExpanded(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} className="max-h-[80vh] max-w-[90vw] rounded-xl" />
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/components/admin/common/AdminImagePreview.tsx
git commit -m "feat(admin): add AdminImagePreview component (#107)"
```

---

### Task 6: AdminPagination 공통 컴포넌트

**Files:**
- Create: `packages/web/lib/components/admin/common/AdminPagination.tsx`

- [ ] **Step 1: 기존 Pagination 패턴 기반으로 공통화**

```tsx
"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function AdminPagination({ currentPage, totalPages, onPageChange }: AdminPaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | "ellipsis")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "ellipsis") {
      pages.push("ellipsis");
    }
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="px-2 text-gray-400">...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              "w-8 h-8 rounded-md text-sm font-medium transition-colors",
              p === currentPage
                ? "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900"
                : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            )}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="rounded-md p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/components/admin/common/AdminPagination.tsx
git commit -m "feat(admin): add AdminPagination common component (#107)"
```

---

### Task 7: Audit Log DDL 마이그레이션

**Files:**
- Create: Supabase migration via `mcp__supabase__apply_migration`

- [ ] **Step 1: audit log 테이블 생성**

```sql
CREATE TABLE IF NOT EXISTS warehouse.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  action text NOT NULL,
  target_table text NOT NULL,
  target_id uuid,
  before_state jsonb,
  after_state jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON warehouse.admin_audit_log(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON warehouse.admin_audit_log(target_table, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON warehouse.admin_audit_log(created_at DESC);

COMMENT ON TABLE warehouse.admin_audit_log IS 'Admin action audit trail for all seed-ops and entity management operations';
```

- [ ] **Step 2: 커밋 (마이그레이션은 Supabase MCP로 적용)**

---

### Task 8: Audit Log 유틸리티 함수

**Files:**
- Create: `packages/web/lib/api/admin/audit-log.ts`

- [ ] **Step 1: audit log 기록 유틸리티**

```typescript
import { createSupabaseServerClient } from "@/lib/supabase/server";

interface AuditLogEntry {
  adminUserId: string;
  action: string;
  targetTable: string;
  targetId?: string;
  beforeState?: Record<string, unknown>;
  afterState?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function writeAuditLog(entry: AuditLogEntry) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .schema("warehouse")
    .from("admin_audit_log")
    .insert({
      admin_user_id: entry.adminUserId,
      action: entry.action,
      target_table: entry.targetTable,
      target_id: entry.targetId,
      before_state: entry.beforeState,
      after_state: entry.afterState,
      metadata: entry.metadata,
    });

  if (error) {
    console.error("[audit-log] Failed to write:", error.message);
  }
}

export async function getAdminUserId(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/api/admin/audit-log.ts
git commit -m "feat(admin): add audit log utility functions (#107)"
```

---

### Task 9: 공통 컴포넌트 barrel export

**Files:**
- Create: `packages/web/lib/components/admin/common/index.ts`

- [ ] **Step 1: barrel export 파일**

```typescript
export { AdminDataTable, type Column } from "./AdminDataTable";
export { AdminStatusBadge } from "./AdminStatusBadge";
export { AdminBulkActionBar, type BulkAction } from "./AdminBulkActionBar";
export { AdminImagePreview } from "./AdminImagePreview";
export { AdminPagination } from "./AdminPagination";
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/components/admin/common/index.ts
git commit -m "feat(admin): add barrel export for common admin components (#107)"
```

---

## Phase 1: 엔티티 관리 (순차) — Issue #108

### Task 10: Artists 관리 API Route

**Files:**
- Create: `packages/web/app/api/admin/entities/artists/route.ts`
- Create: `packages/web/app/api/admin/entities/artists/[id]/route.ts`

- [ ] **Step 1: GET (목록) + POST (생성) route**

```typescript
// route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { writeAuditLog, getAdminUserId } from "@/lib/api/admin/audit-log";

export async function GET(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = req.nextUrl;
  const page = Number(searchParams.get("page") ?? 1);
  const perPage = Number(searchParams.get("per_page") ?? 20);
  const search = searchParams.get("search") ?? "";

  let query = supabase
    .schema("warehouse")
    .from("artists")
    .select("*", { count: "exact" });

  if (search) {
    query = query.or(`name_en.ilike.%${search}%,name_ko.ilike.%${search}%`);
  }

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    data,
    pagination: {
      current_page: page,
      per_page: perPage,
      total_items: count ?? 0,
      total_pages: Math.ceil((count ?? 0) / perPage),
    },
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { data, error } = await supabase
    .schema("warehouse")
    .from("artists")
    .insert(body)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminUserId: user.id,
    action: "create",
    targetTable: "artists",
    targetId: data.id,
    afterState: data,
  });

  return NextResponse.json({ data });
}
```

- [ ] **Step 2: GET/PATCH/DELETE (단일) route**

```typescript
// [id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin } from "@/lib/supabase/admin";
import { writeAuditLog } from "@/lib/api/admin/audit-log";

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .schema("warehouse")
    .from("artists")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get before state
  const { data: before } = await supabase.schema("warehouse").from("artists").select("*").eq("id", id).single();

  const body = await req.json();
  const { data, error } = await supabase
    .schema("warehouse")
    .from("artists")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminUserId: user.id,
    action: "update",
    targetTable: "artists",
    targetId: id,
    beforeState: before,
    afterState: data,
  });

  return NextResponse.json({ data });
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await checkIsAdmin(supabase, user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: before } = await supabase.schema("warehouse").from("artists").select("*").eq("id", id).single();

  const { error } = await supabase.schema("warehouse").from("artists").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeAuditLog({
    adminUserId: user.id,
    action: "delete",
    targetTable: "artists",
    targetId: id,
    beforeState: before,
  });

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 3: 커밋**

```bash
git add packages/web/app/api/admin/entities/
git commit -m "feat(admin): add artists entity API routes with audit log (#108)"
```

---

### Task 11: Artists React Query hooks

**Files:**
- Create: `packages/web/lib/api/admin/entities.ts`

- [ ] **Step 1: hooks 구현**

```typescript
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json();
}

// ─── Artists ─────────────────────────────────────────────

interface EntityListResponse<T> {
  data: T[];
  pagination: { current_page: number; per_page: number; total_items: number; total_pages: number };
}

export interface Artist {
  id: string;
  name_en: string | null;
  name_ko: string | null;
  profile_image_url: string | null;
  primary_instagram_account_id: string | null;
  created_at: string;
}

export function useArtistList(page: number, perPage = 20, search = "") {
  return useQuery<EntityListResponse<Artist>>({
    queryKey: ["admin", "artists", "list", page, perPage, search],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.set("search", search);
      return adminFetch(`/api/admin/entities/artists?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Artist>) =>
      adminFetch("/api/admin/entities/artists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "artists"] }),
  });
}

export function useUpdateArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Artist> & { id: string }) =>
      adminFetch(`/api/admin/entities/artists/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "artists"] }),
  });
}

export function useDeleteArtist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/entities/artists/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "artists"] }),
  });
}

// ─── Brands ──────────────────────────────────────────────

export interface Brand {
  id: string;
  name_en: string | null;
  name_ko: string | null;
  logo_image_url: string | null;
  primary_instagram_account_id: string | null;
  created_at: string;
}

export function useBrandList(page: number, perPage = 20, search = "") {
  return useQuery<EntityListResponse<Brand>>({
    queryKey: ["admin", "brands", "list", page, perPage, search],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      if (search) params.set("search", search);
      return adminFetch(`/api/admin/entities/brands?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}

export function useCreateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Brand>) =>
      adminFetch("/api/admin/entities/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

export function useUpdateBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: Partial<Brand> & { id: string }) =>
      adminFetch(`/api/admin/entities/brands/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

export function useDeleteBrand() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/api/admin/entities/brands/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "brands"] }),
  });
}

// ─── Group Members ───────────────────────────────────────

export interface GroupMember {
  id: string;
  group_id: string;
  artist_id: string;
  role: string | null;
  created_at: string;
}

export function useGroupMemberList(page: number, perPage = 20) {
  return useQuery<EntityListResponse<GroupMember>>({
    queryKey: ["admin", "group-members", "list", page, perPage],
    queryFn: ({ signal }) => {
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
      return adminFetch(`/api/admin/entities/group-members?${params}`, { signal });
    },
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  });
}
```

- [ ] **Step 2: 커밋**

```bash
git add packages/web/lib/api/admin/entities.ts
git commit -m "feat(admin): add entity management React Query hooks (#108)"
```

---

### Task 12: Artists 관리 페이지

**Files:**
- Create: `packages/web/app/admin/entities/artists/page.tsx`

- [ ] **Step 1: Artists 페이지 구현**

AdminDataTable + AdminStatusBadge + AdminPagination + AdminBulkActionBar를 조합한 CRUD 페이지. seed-ops의 `artists-table-client.tsx`를 참고하되 모노레포 admin 패턴으로 재작성.

기능:
- 아티스트 목록 (검색, 페이지네이션)
- 인라인 편집 (이름, 프로필 이미지)
- 삭제 (confirm dialog)
- 신규 생성 모달

- [ ] **Step 2: 커밋**

---

### Task 13: Brands 관리 페이지

**Files:**
- Create: `packages/web/app/admin/entities/brands/page.tsx`
- Create: `packages/web/app/api/admin/entities/brands/route.ts`
- Create: `packages/web/app/api/admin/entities/brands/[id]/route.ts`

- [ ] **Step 1: Brands API Routes** (artists와 동일 패턴, 테이블명만 변경)
- [ ] **Step 2: Brands 페이지 구현**
- [ ] **Step 3: 커밋**

---

### Task 14: Group Members 관리 페이지

**Files:**
- Create: `packages/web/app/admin/entities/group-members/page.tsx`
- Create: `packages/web/app/api/admin/entities/group-members/route.ts`

- [ ] **Step 1: Group Members API Route**
- [ ] **Step 2: Group Members 페이지 구현**
- [ ] **Step 3: 커밋**

---

## Phase 2: Seed 파이프라인 (병렬) — Issue #109

> Phase 2는 3개 병렬 에이전트로 실행. Phase 0-1의 공통 컴포넌트를 활용.

### Task 15 (Agent A): Candidates 목록 + 상세 페이지

**Files:**
- Create: `packages/web/app/admin/seed/candidates/page.tsx`
- Create: `packages/web/app/admin/seed/candidates/[id]/page.tsx`
- Create: `packages/web/app/api/admin/candidates/route.ts`
- Create: `packages/web/app/api/admin/candidates/[id]/route.ts`
- Create: `packages/web/app/api/admin/candidates/[id]/approve/route.ts`
- Create: `packages/web/app/api/admin/candidates/[id]/reject/route.ts`
- Create: `packages/web/app/api/admin/candidates/[id]/source/route.ts`
- Create: `packages/web/lib/api/admin/candidates.ts`

주요 기능:
- seed_posts 기반 후보 목록 (status 필터: draft/approved/rejected)
- 후보 상세: 이미지 프리뷰, source 확정 (대체 이미지 선택/URL/업로드)
- approve/reject 워크플로우
- audit log 연동

---

### Task 16 (Agent B): Post Images + Post Spots 대시보드

**Files:**
- Create: `packages/web/app/admin/seed/post-images/page.tsx`
- Create: `packages/web/app/admin/seed/post-spots/page.tsx`
- Create: `packages/web/app/api/admin/post-images/route.ts`
- Create: `packages/web/app/api/admin/post-spots/route.ts`
- Create: `packages/web/lib/api/admin/seed.ts`

주요 기능:
- 이미지 대시보드 (with_items 필터, 상태별 통계)
- 스팟/솔루션 대시보드 (매핑 현황, 미처리 항목)

---

### Task 17 (Agent C): Review Queue 통합 검수 페이지

**Files:**
- Create: `packages/web/app/admin/review/page.tsx`
- Create: `packages/web/app/api/admin/review/route.ts`

주요 기능:
- 승인 대기 큐 (candidates + instagram_accounts 통합)
- 빠른 approve/reject 액션
- 벌크 승인

---

## Phase 3: 추가 기능 (병렬) — Issue #110

### Task 18 (Agent A): Bulk Action API

**Files:**
- Create: `packages/web/app/api/admin/bulk/route.ts`
- Create: `packages/web/lib/api/admin/bulk.ts`

주요 기능:
- 다중 대상 일괄 approve/reject/delete
- 트랜잭션 처리 (all-or-nothing)
- bulk audit log 기록

---

### Task 19 (Agent B): Audit Log UI 페이지

**Files:**
- Create: `packages/web/app/admin/audit-log/page.tsx`
- Create: `packages/web/app/api/admin/audit-log/route.ts`
- Create: `packages/web/lib/components/admin/audit-log/AuditLogTable.tsx`
- Create: `packages/web/lib/api/admin/audit-log-query.ts`

주요 기능:
- 전체 admin 액션 이력 조회
- 필터: action type, target_table, admin_user, 날짜 범위
- 페이지네이션

---

### Task 20 (Agent C): Diff Viewer + 롤백

**Files:**
- Create: `packages/web/lib/components/admin/audit-log/AuditDiffViewer.tsx`
- Create: `packages/web/app/api/admin/audit-log/[id]/rollback/route.ts`

주요 기능:
- before/after jsonb 비교 diff 뷰어
- 특정 변경 사항 롤백 (before_state로 복원)
- 롤백 시 새 audit log 항목 생성

---

## Execution Order

```
Phase 0 (순차): Task 1-9  → 공통 기반 확립
Phase 1 (순차): Task 10-14 → 엔티티 관리 (패턴 검증)
Phase 2 (병렬): Task 15-17 → Seed 파이프라인 (3 agents)
Phase 3 (병렬): Task 18-20 → 추가 기능 (3 agents)
```
