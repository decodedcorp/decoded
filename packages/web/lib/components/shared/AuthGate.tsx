"use client";

import { useState, useCallback, type ReactNode } from "react";
import { useAuthStore, type OAuthProvider } from "@/lib/stores/authStore";
import { BottomSheet } from "@/lib/design-system";
import { OAuthButton } from "@/lib/components/auth/OAuthButton";

interface AuthGateProps {
  children: (handleAction: () => void) => ReactNode;
  /** 로그인 유도 시 표시할 메시지 */
  message?: string;
}

/**
 * AuthGate - 인증이 필요한 액션을 감싸는 컴포넌트
 *
 * 로그인 상태면 children의 action을 그대로 실행하고,
 * 비로그인 상태면 로그인 유도 BottomSheet를 표시합니다.
 *
 * @example
 * <AuthGate message="솔루션을 등록하려면 로그인이 필요합니다.">
 *   {(handleAction) => (
 *     <button onClick={handleAction}>솔루션 등록</button>
 *   )}
 * </AuthGate>
 */
export function AuthGate({
  children,
  message = "You need to sign in to use this feature.",
}: AuthGateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isAuthenticated = useAuthStore((s) => !!s.user);
  const { signInWithOAuth, loadingProvider, isLoading } = useAuthStore();

  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  const handleAction = useCallback(
    (action?: () => void) => {
      if (isAuthenticated) {
        action?.();
        return;
      }
      if (action) {
        setPendingAction(() => action);
      }
      setIsOpen(true);
    },
    [isAuthenticated]
  );

  const handleLogin = async (provider: OAuthProvider) => {
    // 로그인 후 현재 페이지로 돌아오도록 설정
    sessionStorage.setItem(
      "post_login_redirect",
      window.location.pathname + window.location.search
    );
    await signInWithOAuth(provider);
  };

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setPendingAction(null);
  }, []);

  return (
    <>
      {children(() => handleAction(pendingAction ?? undefined))}

      <BottomSheet
        isOpen={isOpen}
        onClose={handleClose}
        snapPoints={[0.4]}
        defaultSnapPoint={0.4}
        title="Sign in"
        contentCenter
      >
        <div className="flex flex-col items-center gap-6 px-6 py-4">
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Sign in required
            </h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>

          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <OAuthButton
              provider="google"
              onClick={() => handleLogin("google")}
              isLoading={loadingProvider === "google"}
              disabled={isLoading}
            />
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Maybe later
          </button>
        </div>
      </BottomSheet>
    </>
  );
}
