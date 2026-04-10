import Link from "next/link";

/**
 * Custom 404 Not Found Page
 *
 * Brand-consistent design with DECODED identity.
 * This replaces Next.js's auto-generated /_not-found page
 * which was causing React.Children.only errors with parallel routes.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center bg-[#050505] px-4">
      <p className="mb-6 text-xs font-medium uppercase tracking-[0.3em] text-[#eafd67]">
        DECODED
      </p>
      <h1 className="mb-2 text-7xl font-bold text-white">404</h1>
      <div className="mb-4 h-[2px] w-12 bg-[#eafd67]" />
      <h2 className="mb-2 text-lg font-semibold text-white">Page Not Found</h2>
      <p className="mb-8 max-w-sm text-center text-sm text-white/50">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-[#eafd67] px-6 py-3 text-sm font-semibold text-[#050505] transition-colors hover:bg-[#d4e85c]"
        >
          Go Home
        </Link>
        <Link
          href="/explore"
          className="rounded-lg border border-white/15 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/5"
        >
          Explore
        </Link>
      </div>
    </div>
  );
}
