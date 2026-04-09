"use client";

import { AuthGuard } from "@/lib/components/auth/AuthGuard";

export default function RequestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthGuard>{children}</AuthGuard>;
}
