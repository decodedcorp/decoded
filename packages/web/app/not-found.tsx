import Link from "next/link";

/**
 * Custom 404 Not Found Page
 *
 * This replaces Next.js's auto-generated /_not-found page
 * which was causing React.Children.only errors with parallel routes.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
      <h2 className="mb-2 text-2xl font-semibold text-foreground">
        Page Not Found
      </h2>
      <p className="mb-8 text-center text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Go Home
      </Link>
    </div>
  );
}
