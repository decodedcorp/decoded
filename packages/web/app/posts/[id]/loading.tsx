export default function PostDetailLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background"
      aria-busy="true"
    >
      <div className="w-full max-w-2xl space-y-4 px-4">
        <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-muted" />
        <div className="space-y-2">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
