export default function ModalPostDetailLoading() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative z-10 w-full max-w-lg space-y-4 px-4"
        aria-busy="true"
      >
        <div className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-neutral-800" />
        <div className="space-y-2">
          <div className="h-5 w-2/3 animate-pulse rounded bg-neutral-700" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-700" />
        </div>
      </div>
    </div>
  );
}
