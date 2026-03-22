"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";

gsap.registerPlugin(Draggable);

interface DraggableDoodleProps {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper that makes any neon doodle (SVG, pill, text) draggable.
 * Free movement, no bounds. Brings to front on grab.
 * Inertia enabled for playful throw-and-slide feel.
 */
export function DraggableDoodle({
  children,
  className = "",
  style,
}: DraggableDoodleProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const [inst] = Draggable.create(el, {
      type: "x,y",
      inertia: true,
      onPress() {
        gsap.set(el, { zIndex: 60 });
      },
      onDrag(this: Draggable) {
        const rot = gsap.utils.clamp(-30, 30, this.deltaX * 0.5);
        gsap.to(el, { rotation: rot, duration: 0.08, ease: "power1.out" });
      },
      onDragEnd() {
        gsap.to(el, { rotation: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
      },
      onRelease() {
        gsap.to(el, { zIndex: 22, delay: 0.3 });
      },
    });

    return () => {
      inst.kill();
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`absolute cursor-grab active:cursor-grabbing ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}
