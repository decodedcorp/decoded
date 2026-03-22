import { useRef, useCallback, useEffect, useState } from "react";
import { type DetectedSpot } from "@/lib/stores/requestStore";

interface UseSpotCardSyncOptions {
  spots: DetectedSpot[];
  selectedSpotId: string | null;
  onSelectSpot: (spotId: string | null) => void;
}

interface UseSpotCardSyncReturn {
  cardRefs: React.MutableRefObject<Map<string, HTMLElement | null>>;
  scrollContainerRef: React.RefCallback<HTMLDivElement>;
  selectSpot: (spotId: string | null) => void;
  scrollToCard: (spotId: string) => void;
  visibleSpotId: string | null;
}

/**
 * useSpotCardSync - SpotMarker와 DetectedItemCard 간의 동기화를 관리하는 훅
 *
 * 기능:
 * 1. SpotMarker 클릭 → 해당 카드로 스크롤
 * 2. 카드 스크롤 → SpotMarker 하이라이트 (IntersectionObserver)
 */
export function useSpotCardSync({
  spots,
  selectedSpotId,
  onSelectSpot,
}: UseSpotCardSyncOptions): UseSpotCardSyncReturn {
  const cardRefs = useRef<Map<string, HTMLElement | null>>(new Map());
  const scrollContainerElementRef = useRef<HTMLDivElement | null>(null);
  const [visibleSpotId, setVisibleSpotId] = useState<string | null>(null);

  // Callback ref for scroll container
  const scrollContainerRef = useCallback((node: HTMLDivElement | null) => {
    scrollContainerElementRef.current = node;
  }, []);

  // Scroll to card when spot is selected
  const scrollToCard = useCallback((spotId: string) => {
    const cardElement = cardRefs.current.get(spotId);
    if (cardElement) {
      cardElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, []);

  // Select spot and scroll to card
  const selectSpot = useCallback(
    (spotId: string | null) => {
      onSelectSpot(spotId);
      if (spotId) {
        scrollToCard(spotId);
      }
    },
    [onSelectSpot, scrollToCard]
  );

  // Set up IntersectionObserver for card visibility tracking
  useEffect(() => {
    const container = scrollContainerElementRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the most visible card
        let maxRatio = 0;
        let mostVisibleId: string | null = null;

        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
            maxRatio = entry.intersectionRatio;
            mostVisibleId = entry.target.getAttribute("data-spot-id");
          }
        });

        if (mostVisibleId && maxRatio > 0.5) {
          setVisibleSpotId(mostVisibleId);
        }
      },
      {
        root: container,
        threshold: [0.3, 0.5, 0.7, 1.0],
      }
    );

    // Observe all cards
    cardRefs.current.forEach((element, spotId) => {
      if (element) {
        element.setAttribute("data-spot-id", spotId);
        observer.observe(element);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [spots]);

  // Update selection when visible spot changes (only if not manually selected)
  useEffect(() => {
    if (visibleSpotId && visibleSpotId !== selectedSpotId) {
      // Only auto-select if user is scrolling (not programmatic scroll)
      // This prevents fighting with manual spot clicks
    }
  }, [visibleSpotId, selectedSpotId]);

  return {
    cardRefs,
    scrollContainerRef,
    selectSpot,
    scrollToCard,
    visibleSpotId,
  };
}
