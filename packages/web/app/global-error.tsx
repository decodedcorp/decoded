"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Global error boundary — renders OUTSIDE the app layout.
 *
 * Tailwind is not available here, so inline styles are used
 * to match brand: bg #050505, text #fafafa, accent #eafd67.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ko">
      <body
        style={{
          backgroundColor: "#050505",
          color: "#fafafa",
          fontFamily: "sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          padding: "1rem",
        }}
      >
        <h1 style={{ fontSize: "6rem", fontWeight: 700, margin: "0 0 1rem" }}>
          500
        </h1>
        <h2
          style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem" }}
        >
          Something went wrong
        </h2>
        <p
          style={{
            color: "#a1a1aa",
            textAlign: "center",
            marginBottom: "2rem",
            maxWidth: "400px",
          }}
        >
          An unexpected error occurred. Please try again or return home.
        </p>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={reset}
            style={{
              backgroundColor: "#eafd67",
              color: "#050505",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
          <Link
            href="/"
            style={{
              backgroundColor: "transparent",
              color: "#fafafa",
              border: "1px solid #27272a",
              borderRadius: "0.5rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Go Home
          </Link>
        </div>
      </body>
    </html>
  );
}
