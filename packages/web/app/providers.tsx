"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { getQueryClient } from "@/lib/react-query/client";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/lib/components/auth";
import { Toaster } from "@/lib/components/ui/sonner";

// Supabase 브라우저 클라이언트 초기화는 "@/lib/supabase/client"에서 수행됨

/**
 * App-level providers wrapper
 *
 * This component wraps the app with React Query's QueryClientProvider,
 * ThemeProvider, and AuthProvider for Supabase authentication.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
      <Toaster position="bottom-right" />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
