"use client";

import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

export default function ScrollAnimationExample() {
  const { observeRef } = useScrollAnimation({
    onEnter: (element) => {
      console.log("Element entered viewport:", element);
    },
    onExit: (element) => {
      console.log("Element exited viewport:", element);
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Hero section - loads immediately (no lazy loading) */}
      <header className="mb-16 text-center">
        <h1 className="text-4xl font-bold mb-4">Scroll Animation Demo</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Scroll down to see cards animate smoothly into view with staggered
          delays. Images lazy-load as you scroll near them.
        </p>
        <img
          src="/api/placeholder/1200/400"
          width={1200}
          height={400}
          alt="Hero image - loads immediately"
          className="mt-8 rounded-lg shadow-lg mx-auto"
          loading="eager"
        />
      </header>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Spacer to push cards below fold */}
        <div className="h-screen flex items-center justify-center text-gray-400">
          ↓ Scroll down to see animations ↓
        </div>

        {/* Card 1 - No delay */}
        <div
          ref={observeRef}
          className="js-observe bg-white rounded-lg shadow-lg p-8"
          data-delay="0"
        >
          <h2 className="text-2xl font-bold mb-4">Card 1 - No Delay</h2>
          <p className="text-gray-700 mb-4">
            This card animates immediately when it enters the viewport. The
            animation uses GPU-accelerated properties (opacity and transform)
            for smooth 60fps performance.
          </p>
          <img
            data-src="/api/placeholder/600/300"
            loading="lazy"
            width={600}
            height={300}
            alt="Lazy loaded image 1"
            className="w-full h-auto rounded"
          />
        </div>

        {/* Card 2 - 80ms delay */}
        <div
          ref={observeRef}
          className="js-observe bg-white rounded-lg shadow-lg p-8"
          data-delay="80"
        >
          <h2 className="text-2xl font-bold mb-4">Card 2 - 80ms Delay</h2>
          <p className="text-gray-700 mb-4">
            This card animates 80ms after Card 1, creating a cascading effect.
            The stagger delay is set via the data-delay attribute and CSS custom
            property.
          </p>
          <img
            data-src="/api/placeholder/600/300"
            loading="lazy"
            width={600}
            height={300}
            alt="Lazy loaded image 2"
            className="w-full h-auto rounded"
          />
        </div>

        {/* Card 3 - 160ms delay */}
        <div
          ref={observeRef}
          className="js-observe bg-white rounded-lg shadow-lg p-8"
          data-delay="160"
        >
          <h2 className="text-2xl font-bold mb-4">Card 3 - 160ms Delay</h2>
          <p className="text-gray-700 mb-4">
            This card animates 160ms after Card 1, continuing the cascade.
            Images use data-src attribute and load only when scrolled near.
          </p>
          <img
            data-src="/api/placeholder/600/300"
            loading="lazy"
            width={600}
            height={300}
            alt="Lazy loaded image 3"
            className="w-full h-auto rounded"
          />
        </div>

        {/* Card 4 - 240ms delay */}
        <div
          ref={observeRef}
          className="js-observe bg-white rounded-lg shadow-lg p-8"
          data-delay="240"
        >
          <h2 className="text-2xl font-bold mb-4">Card 4 - 240ms Delay</h2>
          <p className="text-gray-700 mb-4">
            The stagger pattern continues. Each card has fixed dimensions to
            prevent Cumulative Layout Shift (CLS) when images load.
          </p>
          <img
            data-src="/api/placeholder/600/300"
            loading="lazy"
            width={600}
            height={300}
            alt="Lazy loaded image 4"
            className="w-full h-auto rounded"
          />
        </div>

        {/* Card 5 - 320ms delay */}
        <div
          ref={observeRef}
          className="js-observe bg-white rounded-lg shadow-lg p-8"
          data-delay="320"
        >
          <h2 className="text-2xl font-bold mb-4">Card 5 - 320ms Delay</h2>
          <p className="text-gray-700 mb-4">
            Final card demonstrates the complete cascading animation effect.
            Scroll back up to see exit animations!
          </p>
          <img
            data-src="/api/placeholder/600/300"
            loading="lazy"
            width={600}
            height={300}
            alt="Lazy loaded image 5"
            className="w-full h-auto rounded"
          />
        </div>

        {/* Technical Info Section */}
        <div className="bg-blue-50 rounded-lg p-8 mt-16">
          <h3 className="text-xl font-bold mb-4">Technical Details</h3>
          <ul className="space-y-2 text-gray-700">
            <li>✅ GPU-accelerated animations (opacity + transform only)</li>
            <li>✅ IntersectionObserver API (zero dependencies)</li>
            <li>✅ Staggered delays via data-delay attribute</li>
            <li>✅ Lazy image loading with data-src attribute</li>
            <li>✅ Fixed image dimensions (prevents CLS)</li>
            <li>✅ Native loading="lazy" fallback</li>
            <li>✅ 60fps scroll performance target</li>
            <li>✅ Core Web Vitals compliant (CLS ≤ 0.1, LCP ≤ 2.5s)</li>
          </ul>
        </div>

        {/* Spacer at bottom */}
        <div className="h-screen" />
      </div>
    </div>
  );
}
