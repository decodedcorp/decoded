"use client";

import { forwardRef } from "react";
import type { MagazineIssue } from "./types";
import { IssueSpine } from "./IssueSpine";

interface ShelfRowProps {
  issues: MagazineIssue[];
  activeIssueId: string | null;
  onSelectIssue: (id: string | null) => void;
}

/**
 * A single shelf row displaying issue spines in a flex layout.
 * Styled with a 3D wooden shelf edge and drop shadow.
 */
export const ShelfRow = forwardRef<HTMLDivElement, ShelfRowProps>(
  function ShelfRow({ issues, activeIssueId, onSelectIssue }, ref) {
    return (
      <div
        ref={ref}
        className="relative flex items-end justify-center gap-3 md:gap-5 min-h-[200px] md:min-h-[260px] px-6 md:px-10 pt-8 pb-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(30,28,24,0.4) 100%)",
          perspective: "inherit",
          transformStyle: "preserve-3d",
        }}
      >
        {issues.map((issue) => (
          <IssueSpine
            key={issue.id}
            issue={issue}
            isActive={activeIssueId === issue.id}
            onSelect={onSelectIssue}
          />
        ))}

        {/* 3D wooden shelf edge */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[8px] rounded-b-sm"
          style={{
            background: "linear-gradient(180deg, #3a3530 0%, #1e1c18 100%)",
            boxShadow:
              "0 6px 12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        />
      </div>
    );
  }
);
