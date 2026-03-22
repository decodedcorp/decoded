"use client";

import {
  useState,
  useRef,
  useLayoutEffect,
  useEffect,
  useCallback,
} from "react";
import { gsap } from "gsap";
import type { ScanData, ConnectorAnchor } from "./types";
import ImageLayer from "./ImageLayer";
import CalloutLayer from "./CalloutLayer";
import ConnectorLayer from "./ConnectorLayer";
import { getBoxAnchor, getCardAnchor, inferCallout } from "./callout-utils";

interface FashionScanSceneProps {
  data: ScanData;
  mockId?: string;
}

export default function FashionScanScene({
  data,
  mockId = "1",
}: FashionScanSceneProps) {
  const [anchors, setAnchors] = useState<ConnectorAnchor[]>([]);
  const [sceneRect, setSceneRect] = useState<DOMRect | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const scanLineRef = useRef<HTMLDivElement | null>(null);
  const animationCtxRef = useRef<gsap.Context | null>(null);
  const boxRefs = useRef<Partial<Record<string, HTMLDivElement>>>({});
  const cardRefs = useRef<Partial<Record<string, HTMLDivElement>>>({});

  // Scene rect 계산 함수 (순환 참조 방지를 위해 useCallback 제거)
  const recalcSceneRect = () => {
    if (!sceneRef.current) return null;
    const rect = sceneRef.current.getBoundingClientRect();
    setSceneRect(rect);
    return rect;
  };

  // 앵커 계산 함수 (sceneRect를 파라미터로 받아서 dependency 순환 방지)
  const calculateAnchors = useCallback(
    (currentSceneRect: DOMRect) => {
      if (typeof window === "undefined") return;

      const newAnchors: ConnectorAnchor[] = [];

      data.items.forEach((item) => {
        const boxEl = boxRefs.current[item.id];
        const cardEl = cardRefs.current[item.id];

        if (!boxEl || !cardEl) {
          return;
        }

        const boxRect = boxEl.getBoundingClientRect();
        const cardRect = cardEl.getBoundingClientRect();
        const layout = item.callout ?? inferCallout(item.box);

        // Scene-relative coordinates with side-aware anchors
        const boxAnchor = getBoxAnchor(boxRect, currentSceneRect, layout.side);
        const cardAnchor = getCardAnchor(
          cardRect,
          currentSceneRect,
          layout.side
        );

        newAnchors.push({
          itemId: item.id,
          boxAnchor,
          cardAnchor,
        });
      });

      // 개발 단계에서 디버깅용 로그
      if (process.env.NODE_ENV === "development") {
        console.log("Anchors calculated:", newAnchors);
      }

      setAnchors(newAnchors);
    },
    [data.items]
  );

  // Scene rect 계산 (useLayoutEffect로 깜빡임 방지)
  useLayoutEffect(() => {
    const rect = recalcSceneRect();
    if (rect) {
      calculateAnchors(rect);
    }
  }, [calculateAnchors]);

  // Trigger animation function
  const triggerAnimation = useCallback(() => {
    if (hasAnimated || isAnimating) return;
    if (typeof window === "undefined") return;
    if (!sceneRef.current || !scanLineRef.current) return;

    setIsAnimating(true);

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      gsap.set(".fs-box, .fs-card", { autoAlpha: 1 });
      setHasAnimated(true);
      setIsAnimating(false);
      return;
    }

    // Reset scan line position
    gsap.set(scanLineRef.current, { yPercent: -100 });
    gsap.set(".fs-box, .fs-card", { autoAlpha: 0, y: 0 });

    // Create and run animation timeline
    const tl = gsap.timeline({
      onComplete: () => {
        setHasAnimated(true);
        setIsAnimating(false);
      },
    });

    // Scan line moves from top to bottom (slower: 1.0s)
    tl.fromTo(
      scanLineRef.current,
      { yPercent: -100 },
      { yPercent: 100, duration: 1.0, ease: "power2.out" }
    )
      // Boxes fade in with stagger (starts 0.1s after scan line)
      .fromTo(
        ".fs-box",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.2, stagger: 0.05 },
        "<+0.1"
      )
      // Cards fade in with stagger and slight upward motion (starts 0.1s after boxes)
      .fromTo(
        ".fs-card",
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 1, y: 0, duration: 0.25, stagger: 0.08 },
        "<+0.1"
      );
  }, [hasAnimated, isAnimating]);

  // Initialize animation setup and Intersection Observer for scroll-based trigger
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (!sceneRef.current || !scanLineRef.current) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      // Skip animation, set all elements to visible immediately
      gsap.set(".fs-box, .fs-card", { autoAlpha: 1 });
      setHasAnimated(true);
      return;
    }

    // Create GSAP context for proper cleanup
    animationCtxRef.current = gsap.context(() => {
      // Context is ready, animation will be triggered on scroll
    }, sceneRef);

    // Set up Intersection Observer to trigger animation when scene enters viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            triggerAnimation();
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the scene is visible
        rootMargin: "0px",
      }
    );

    if (sceneRef.current) {
      observer.observe(sceneRef.current);
    }

    // Cleanup on unmount
    return () => {
      observer.disconnect();
      if (animationCtxRef.current) {
        animationCtxRef.current.revert();
        animationCtxRef.current = null;
      }
    };
  }, [hasAnimated, triggerAnimation]);

  // sceneRect가 변경될 때 앵커 재계산
  useEffect(() => {
    if (sceneRect) {
      calculateAnchors(sceneRect);
    }
  }, [sceneRect, calculateAnchors]);

  // 리사이즈 및 스크롤 이벤트 처리
  useEffect(() => {
    const handleResize = () => {
      const rect = recalcSceneRect();
      if (rect) {
        calculateAnchors(rect);
      }
    };

    const handleScroll = () => {
      const rect = recalcSceneRect();
      if (rect) {
        calculateAnchors(rect);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [calculateAnchors]);

  const handleBoxRefsChange = (
    map: Partial<Record<string, HTMLDivElement>>
  ) => {
    boxRefs.current = map;
    // ref 변경 시 즉시 재계산
    if (typeof window !== "undefined" && sceneRect) {
      requestAnimationFrame(() => {
        calculateAnchors(sceneRect);
      });
    }
  };

  const handleCardRefsChange = (
    map: Partial<Record<string, HTMLDivElement>>
  ) => {
    cardRefs.current = map;
    // ref 변경 시 즉시 재계산
    if (typeof window !== "undefined" && sceneRect) {
      requestAnimationFrame(() => {
        calculateAnchors(sceneRect);
      });
    }
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Scene container */}
        <div ref={sceneRef} className="relative aspect-[3/4] max-w-2xl mx-auto">
          {/* Scan line overlay */}
          <div
            ref={scanLineRef}
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: `linear-gradient(
                to bottom,
                transparent 0%,
                transparent 40%,
                rgba(217, 252, 105, 0.3) 50%,
                transparent 60%,
                transparent 100%
              )`,
            }}
            aria-hidden="true"
          />

          {/* 이미지 레이어 */}
          <ImageLayer
            photoUrl={data.photoUrl}
            items={data.items}
            onBoxRefsChange={handleBoxRefsChange}
            mockId={mockId}
            shouldAnimate={isAnimating}
          />

          {/* Callout 레이어 (카드들) */}
          <CalloutLayer
            items={data.items}
            data={data}
            onCardRefsChange={handleCardRefsChange}
          />

          {/* SVG 연결선 레이어 */}
          <ConnectorLayer anchors={anchors} />
        </div>
      </div>
    </div>
  );
}
