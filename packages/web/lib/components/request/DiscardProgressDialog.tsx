"use client";

import { useEffect, useRef } from "react";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DiscardProgressDialog({ open, onCancel, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onKeyDown={(e) => {
        // RequestFlowModal.tsx의 window keydown 구독이 Esc에 반응하므로,
        // 다이얼로그 내부 Esc가 바깥으로 전파되면 외부 모달까지 닫힘. 차단 필수.
        if (e.key === "Escape") e.stopPropagation();
      }}
      className="w-[min(22rem,92vw)] rounded-xl bg-background p-6 shadow-xl backdrop:bg-black/50"
    >
      <h2 className="text-lg font-semibold">Discard progress?</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        You&rsquo;ll lose spots and details you&rsquo;ve added so far.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg hover:bg-muted"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90"
        >
          Discard and go back
        </button>
      </div>
    </dialog>
  );
}
