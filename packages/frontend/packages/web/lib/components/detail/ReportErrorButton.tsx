"use client";

import React, { useState, useRef, useEffect } from "react";
import { AlertCircle, X, Send } from "lucide-react";

type Props = {
  postId?: string; // Made optional as per new usage in floating controls
  size?: "sm" | "md"; // Optional size prop
};

export function ReportErrorButton({ postId, size = "sm" }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close modal when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    console.log("Report Error Submitted:", {
      postId: postId || "unknown-post",
      suggest: suggestion,
    });

    // Reset and close after a short delay to simulate network request
    setTimeout(() => {
      setSuggestion("");
      setIsSubmitting(false);
      setIsOpen(false);
      alert("소중한 의견 감사합니다! 빠르게 확인해보겠습니다.");
    }, 500);
  };

  const buttonClasses =
    size === "md"
      ? "flex h-10 w-10 items-center justify-center rounded-full bg-background/80 text-muted-foreground backdrop-blur-sm transition-transform hover:scale-105 hover:bg-red-500/10 hover:text-red-500 active:scale-95 border border-border"
      : "p-1 rounded-full text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-colors";

  const iconSize = size === "md" ? 20 : 14;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={buttonClasses}
        title="오류 신고하기"
        aria-label="Report issue"
      >
        <AlertCircle size={iconSize} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={modalRef}
            className="w-full max-w-md bg-background rounded-lg shadow-xl border border-border p-6 relative animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <h3 className="text-lg font-semibold mb-2">오류 신고</h3>
            <p className="text-sm text-muted-foreground mb-4">
              포스트 내용에 오류가 있나요? 내용을 남겨주시면 빠르게
              수정하겠습니다.
            </p>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="suggestion"
                  className="block text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide"
                >
                  내용
                </label>
                <textarea
                  id="suggestion"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="예: 아이템 정보가 이미지와 다릅니다..."
                  className="w-full min-h-[100px] p-3 rounded-md bg-accent/50 border border-input focus:border-ring focus:ring-1 focus:ring-ring outline-none resize-none text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !suggestion.trim()}
                  className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSubmitting ? (
                    "전송 중..."
                  ) : (
                    <>
                      보내기 <Send size={14} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
