export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-[#050505] overflow-x-hidden">
      {/* Hero skeleton */}
      <div className="relative w-full h-[70vh] md:h-[85vh] bg-neutral-900 animate-pulse" />

      {/* Editorial + Trending skeleton */}
      <section className="py-14 lg:py-20 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl grid grid-cols-1 lg:grid-cols-[5fr_7fr] gap-8 lg:min-h-[520px]">
          <div className="rounded-xl bg-neutral-900 animate-pulse aspect-[4/3] lg:aspect-auto" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-lg bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Magazine skeleton */}
      <section className="py-14 px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-7xl">
          <div className="h-8 w-48 bg-neutral-900 animate-pulse rounded mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] rounded-xl bg-neutral-900 animate-pulse"
              />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
