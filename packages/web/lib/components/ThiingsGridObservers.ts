/**
 * ThiingsGridObservers
 *
 * IntersectionObserver setup for:
 *  - Card visibility / stagger animation (js-observe elements)
 *  - Image lazy-loading (img[data-src] elements)
 */

export type ObserverState = {
  staggerPositionCache: WeakMap<Element, number>;
  staggerDelayMap: WeakMap<Element, number>;
  staggerTick: number;
};

/**
 * Creates the IntersectionObserver for card visibility and stagger animation.
 * Returns the observer instance; caller must call `observeCardElements` to start observing.
 */
export function initializeIntersectionObserver(
  state: ObserverState
): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") {
    return null; // SSR / legacy browser fallback
  }

  return new IntersectionObserver(
    (entries) => {
      requestAnimationFrame(() => {
        // First pass: cache top positions for stagger calculation
        entries.forEach((entry) => {
          if (
            entry.isIntersecting &&
            !state.staggerPositionCache.has(entry.target)
          ) {
            const rect = entry.target.getBoundingClientRect();
            state.staggerPositionCache.set(entry.target, rect.top);
          }
        });

        // Second pass: sort by cached position and assign stagger delays
        const intersectingEntries = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => {
            const topA = state.staggerPositionCache.get(a.target) ?? 0;
            const topB = state.staggerPositionCache.get(b.target) ?? 0;
            return topA - topB;
          });

        intersectingEntries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          if (!state.staggerDelayMap.has(el)) {
            const delay = Math.min((state.staggerTick++ % 6) * 40, 240); // Max 240ms
            state.staggerDelayMap.set(el, delay);
          }
          const delay = state.staggerDelayMap.get(el) ?? 0;
          el.style.setProperty("--stagger", `${delay}ms`);
        });

        // Third pass: handle visibility classes with hysteresis
        entries.forEach((entry) => {
          const el = entry.target as HTMLElement;
          const intersectionRatio = entry.intersectionRatio;

          if (entry.isIntersecting && intersectionRatio >= 0.15) {
            // Entry: only trigger at 0.15 threshold
            el.classList.add("is-visible");
            el.classList.remove("is-hidden");
          } else if (!entry.isIntersecting || intersectionRatio < 0.05) {
            // Exit: trigger at 0.0 threshold (very low ratio)
            el.classList.add("is-hidden");
            el.classList.remove("is-visible");
          }
        });
      });
    },
    {
      threshold: [0, 0.15, 0.3], // Multiple thresholds for hysteresis
      rootMargin: "20% 0px -20% 0px", // Buffer for earlier triggering
    }
  );
}

/**
 * Creates the IntersectionObserver for image lazy-loading.
 * Returns the observer instance; caller must call `observeImages` to start observing.
 */
export function initializeImageObserver(imageObserverRef: {
  current: IntersectionObserver | null;
}): IntersectionObserver | null {
  if (typeof IntersectionObserver === "undefined") {
    return null;
  }

  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 1000;
  const rootMarginMultiplier = 1.0; // Tune between 0.6-1.2 based on network/main-thread balance
  const rootMarginValue = `${Math.round(viewportHeight * rootMarginMultiplier)}px`;

  return new IntersectionObserver(
    (entries) => {
      requestAnimationFrame(() => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const alreadyLoaded =
              img.dataset.loaded === "true" ||
              img.getAttribute("data-loaded") === "true";
            if (!alreadyLoaded && img.dataset.src) {
              img.src = img.dataset.src;
              img.dataset.loaded = "true";
              // Stop observing once loaded to reduce observer overhead
              imageObserverRef.current?.unobserve(img);
            }
          }
        });
      });
    },
    {
      threshold: 0, // Trigger immediately when any pixel enters
      rootMargin: `${rootMarginValue} 0px`, // Load images before they appear (50% viewport buffer)
    }
  );
}

/**
 * Observe all card elements with .js-observe class in the container.
 */
export function observeCardElements(
  containerEl: HTMLElement | null,
  observer: IntersectionObserver | null
): void {
  if (!observer || !containerEl) return;

  requestAnimationFrame(() => {
    const cardElements = containerEl.querySelectorAll(".js-observe");
    cardElements.forEach((el) => {
      observer.observe(el);
    });
  });
}

/**
 * Observe all img[data-src] elements in the container for lazy-loading.
 */
export function observeImages(
  containerEl: HTMLElement | null,
  observer: IntersectionObserver | null
): void {
  if (!observer || !containerEl) return;

  requestAnimationFrame(() => {
    const images = containerEl.querySelectorAll("img[data-src]");
    images.forEach((img) => {
      const alreadyLoaded = img.getAttribute("data-loaded") === "true";
      if (!alreadyLoaded) {
        observer.observe(img);
      }
    });
  });
}
