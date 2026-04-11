/**
 * Shown while the intercepting route's RSC prefetch (prefetchPostDetail)
 * is in-flight. Mirrors the final ImageDetailModal layout so the transition
 * from loading → modal is seamless: desktop = left floating image panel
 * + right drawer, mobile = bottom sheet.
 */
export default function ModalPostDetailLoading() {
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-end md:items-stretch md:justify-end"
      aria-busy="true"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-sm" />

      {/* Desktop: left floating image skeleton */}
      <div className="hidden md:flex absolute inset-y-0 left-0 z-[60] items-center justify-center p-8 pointer-events-none md:right-[50vw] lg:right-[600px] xl:right-[700px]">
        <div className="relative w-full max-w-[500px] h-[75vh] rounded-lg overflow-hidden shadow-2xl bg-white/5">
          <div className="w-full h-full animate-pulse bg-white/10" />
        </div>
      </div>

      {/* Drawer skeleton (mobile: bottom sheet, desktop: right-side drawer) */}
      <aside className="relative z-[70] flex h-[90vh] md:h-full w-full flex-col bg-background shadow-2xl rounded-t-[20px] md:rounded-none md:w-[50vw] lg:w-[600px] xl:w-[700px] overflow-hidden pb-[env(safe-area-inset-bottom,0px)]">
        {/* Drag handle - mobile only */}
        <div className="md:hidden flex items-center justify-center py-3 shrink-0">
          <div className="w-10 h-1 bg-[#3D3D3D] rounded-sm" />
        </div>
        <div className="relative flex-1 overflow-hidden">
          <div className="flex flex-col gap-6 px-6 py-12 animate-pulse">
            <div className="flex flex-col items-center gap-2">
              <div className="h-14 w-14 rounded-full bg-white/10" />
              <div className="h-4 w-24 rounded bg-white/10" />
              <div className="h-3 w-16 rounded bg-white/10" />
            </div>
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-3/4 rounded bg-white/10" />
              <div className="h-4 w-1/2 rounded bg-white/10" />
            </div>
            <div className="mt-4 flex flex-col gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 rounded bg-white/10" />
                  <div className="flex flex-1 flex-col justify-center gap-2">
                    <div className="h-4 w-1/2 rounded bg-white/10" />
                    <div className="h-3 w-3/4 rounded bg-white/10" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
