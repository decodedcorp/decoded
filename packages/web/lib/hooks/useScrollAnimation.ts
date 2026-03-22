import { useEffect, useRef, useCallback } from "react";

/**
 * Configuration options for the useScrollAnimation hook
 */
export interface UseScrollAnimationOptions {
  /**
   * Threshold at which observer callback fires (0.0 to 1.0)
   * @default 0.15 (15% visibility)
   */
  threshold?: number | number[];

  /**
   * Margin around root element for early/late triggering
   * @default "0px 0px -10% 0px"
   */
  rootMargin?: string;

  /**
   * Root element for intersection observation
   * @default null (viewport)
   */
  root?: Element | null;

  /**
   * Callback fired when element enters viewport
   */
  onEnter?: (element: Element, entry: IntersectionObserverEntry) => void;

  /**
   * Callback fired when element exits viewport
   */
  onExit?: (element: Element, entry: IntersectionObserverEntry) => void;

  /**
   * Enable/disable lazy image loading
   * @default true
   */
  enableLazyLoad?: boolean;

  /**
   * Enable/disable animation classes
   * @default true
   */
  enableAnimation?: boolean;
}

/**
 * Return value from useScrollAnimation hook
 */
export interface UseScrollAnimationReturn {
  /**
   * Ref callback to attach to observable elements
   */
  observeRef: (element: Element | null) => void;

  /**
   * Manually trigger observation of an element
   */
  observe: (element: Element) => void;

  /**
   * Manually stop observing an element
   */
  unobserve: (element: Element) => void;

  /**
   * Disconnect all observations
   */
  disconnect: () => void;

  /**
   * Check if an element is currently being observed
   */
  isObserving: (element: Element) => boolean;
}

/**
 * Internal interface for tracking animation state of observed elements
 * @internal
 */
interface AnimationState {
  /**
   * DOM element being observed
   */
  element: Element;

  /**
   * Current visibility state
   */
  isVisible: boolean;

  /**
   * Whether image has been loaded (if element contains lazy image)
   */
  imageLoaded: boolean;

  /**
   * Stagger delay extracted from data-delay attribute
   */
  staggerDelay: number;

  /**
   * IntersectionObserver entry for this element
   */
  entry: IntersectionObserverEntry | null;
}

/**
 * Custom React hook for scroll-based animations and lazy loading using IntersectionObserver
 *
 * @param options - Configuration options for the animation and observation behavior
 * @returns Object with methods to observe elements and control the observer
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { observeRef } = useScrollAnimation({
 *     threshold: 0.15,
 *     onEnter: (el) => console.log('Element entered:', el)
 *   })
 *
 *   return (
 *     <div ref={observeRef} className="js-observe" data-delay="80">
 *       Content that animates on scroll
 *     </div>
 *   )
 * }
 * ```
 */
export function useScrollAnimation(
  options: UseScrollAnimationOptions = {}
): UseScrollAnimationReturn {
  const {
    threshold = 0.15,
    rootMargin = "0px 0px -10% 0px",
    root = null,
    onEnter,
    onExit,
    enableLazyLoad = true,
    enableAnimation = true,
  } = options;

  // T033: Input validation for threshold and rootMargin
  if (process.env.NODE_ENV !== "production") {
    // Validate threshold
    if (Array.isArray(threshold)) {
      threshold.forEach((t) => {
        if (t < 0 || t > 1) {
          console.error(
            `[useScrollAnimation] Invalid threshold value: ${t}. Must be between 0.0 and 1.0`
          );
        }
      });
    } else if (threshold < 0 || threshold > 1) {
      console.error(
        `[useScrollAnimation] Invalid threshold: ${threshold}. Must be between 0.0 and 1.0`
      );
    }

    // Validate rootMargin (basic CSS string check)
    if (!/^(-?\d+(%|px)\s*){1,4}$/.test(rootMargin.trim())) {
      console.error(
        `[useScrollAnimation] Invalid rootMargin: "${rootMargin}". Must be a valid CSS margin string (e.g., "0px 0px -10% 0px")`
      );
    }
  }

  const observerRef = useRef<IntersectionObserver | null>(null);
  const observedElements = useRef<Set<Element>>(new Set());
  // T035: WeakMap for element state storage (automatic garbage collection)
  const elementStateMap = useRef<WeakMap<Element, { imageLoaded: boolean }>>(
    new WeakMap()
  );

  // T010: Initialize IntersectionObserver
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        // T032: O(1) complexity - process entries directly without additional DOM queries
        // T034: Avoid layout queries like getBoundingClientRect, offsetWidth
        entries.forEach((entry) => {
          const element = entry.target;

          // T012: Extract and set stagger delay from data-delay attribute
          // This is a simple attribute read, not a layout query - O(1)
          const delay = element.getAttribute("data-delay") || "0";
          if (element instanceof HTMLElement) {
            element.style.setProperty("--stagger", `${delay}ms`);
          }

          // T011: Handle intersection - toggle classes and trigger callbacks
          if (entry.isIntersecting) {
            // Element entered viewport

            // T035: Use WeakMap to track image load state for automatic GC
            const state = elementStateMap.current.get(element) || {
              imageLoaded: false,
            };

            // Handle lazy image loading (if enabled)
            if (enableLazyLoad && !state.imageLoaded) {
              // Single querySelector per element - O(1) for element tree
              // Support both .lazy class and img[data-src] selector
              const img = element.querySelector(
                "img.lazy[data-src], img[data-src]"
              ) as HTMLImageElement | null;
              if (img) {
                // Check if already loaded via dataset.loaded or data-loaded attribute
                const alreadyLoaded =
                  img.dataset.loaded === "true" ||
                  img.getAttribute("data-loaded") === "true";
                if (!alreadyLoaded) {
                  const src = img.getAttribute("data-src");
                  if (src) {
                    // Use direct property assignment for better performance
                    img.src = src;
                    img.dataset.loaded = "true";
                    // Update WeakMap state to prevent reloading
                    state.imageLoaded = true;
                    elementStateMap.current.set(element, state);
                  }
                }
              }
            }

            // Toggle animation classes (if enabled)
            // classList operations are O(1)
            if (enableAnimation) {
              element.classList.add("is-visible");
              element.classList.remove("is-hidden");
            }

            // Fire onEnter callback
            onEnter?.(element, entry);
          } else {
            // Element exited viewport

            // Toggle animation classes (if enabled)
            if (enableAnimation) {
              element.classList.add("is-hidden");
              element.classList.remove("is-visible");
            }

            // Fire onExit callback
            onExit?.(element, entry);
          }
        });
      },
      {
        threshold,
        rootMargin,
        root,
      }
    );

    // T014: Cleanup on unmount
    return () => {
      observerRef.current?.disconnect();
      observedElements.current.clear();
    };
  }, [
    threshold,
    rootMargin,
    root,
    onEnter,
    onExit,
    enableLazyLoad,
    enableAnimation,
  ]);

  // T013: Implement observeRef callback for ref-based observation
  const observeRef = useCallback((element: Element | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
      observedElements.current.add(element);
    }
  }, []);

  // Manual observe method
  const observe = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.observe(element);
      observedElements.current.add(element);
    }
  }, []);

  // Manual unobserve method
  const unobserve = useCallback((element: Element) => {
    if (observerRef.current) {
      observerRef.current.unobserve(element);
      observedElements.current.delete(element);
    }
  }, []);

  // Disconnect all observations
  const disconnect = useCallback(() => {
    observerRef.current?.disconnect();
    observedElements.current.clear();
  }, []);

  // Check if element is being observed
  const isObserving = useCallback((element: Element): boolean => {
    return observedElements.current.has(element);
  }, []);

  return {
    observeRef,
    observe,
    unobserve,
    disconnect,
    isObserving,
  };
}
