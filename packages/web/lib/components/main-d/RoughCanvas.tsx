"use client";

import { useRef, useEffect, useCallback } from "react";
import rough from "roughjs";
import type { RoughCanvas as RoughCanvasType } from "roughjs/bin/canvas";

/**
 * RoughCanvas — hand-drawn SVG overlay for the sticker bomb canvas.
 *
 * Draws sketchy neon doodles using RoughJS:
 * - Wobbly rectangles, circles, lines
 * - Lightning bolts, arrows, stars
 * - Hand-drawn speech bubbles
 *
 * All drawn in neon green (#eafd67) on a transparent canvas.
 * pointer-events-none — decorative layer only.
 */
export function RoughCanvasOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    // Match parent size
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    canvas.width = w * 2; // 2x for retina
    canvas.height = h * 2;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, w, h);

    const rc: RoughCanvasType = rough.canvas(canvas);
    const neon = "#eafd67";
    const opts = { stroke: neon, strokeWidth: 2.5, roughness: 2.5, bowing: 2 };
    const thinOpts = {
      stroke: neon,
      strokeWidth: 1.8,
      roughness: 2,
      bowing: 1.5,
    };
    const fillOpts = {
      fill: neon,
      fillStyle: "solid" as const,
      stroke: "#000",
      strokeWidth: 1.5,
      roughness: 2,
    };

    // ── Sketchy circles scattered around ──
    rc.circle(w * 0.08, h * 0.15, 40, opts);
    rc.circle(w * 0.92, h * 0.7, 50, opts);
    rc.circle(w * 0.45, h * 0.85, 35, { ...opts, strokeWidth: 2 });
    rc.circle(w * 0.72, h * 0.12, 28, thinOpts);

    // ── Wobbly rectangles (speech bubble outlines) ──
    rc.rectangle(w * 0.28, h * 0.02, 90, 45, opts);
    rc.rectangle(w * 0.6, h * 0.75, 80, 40, opts);

    // ── Hand-drawn arrows ──
    // Arrow top-left pointing down-right
    rc.line(w * 0.05, h * 0.05, w * 0.12, h * 0.13, {
      ...opts,
      strokeWidth: 3,
    });
    rc.line(w * 0.12, h * 0.13, w * 0.08, h * 0.12, opts);
    rc.line(w * 0.12, h * 0.13, w * 0.11, h * 0.08, opts);

    // Arrow right side pointing down
    rc.line(w * 0.88, h * 0.25, w * 0.88, h * 0.35, {
      ...opts,
      strokeWidth: 3,
    });
    rc.line(w * 0.88, h * 0.35, w * 0.85, h * 0.32, opts);
    rc.line(w * 0.88, h * 0.35, w * 0.91, h * 0.32, opts);

    // Arrow bottom-left pointing right
    rc.line(w * 0.15, h * 0.78, w * 0.25, h * 0.78, {
      ...opts,
      strokeWidth: 3,
    });
    rc.line(w * 0.25, h * 0.78, w * 0.22, h * 0.75, opts);
    rc.line(w * 0.25, h * 0.78, w * 0.22, h * 0.81, opts);

    // ── Lightning bolts (filled) ──
    rc.path("M15 0 L5 20 L12 20 L7 40 L22 16 L14 16 Z", {
      ...fillOpts,
      stroke: neon,
      strokeWidth: 1,
    });
    // Translate via ctx for second bolt
    ctx.save();
    ctx.translate(w * 0.85, h * 0.45);
    ctx.scale(0.8, 0.8);
    rc.path("M15 0 L5 20 L12 20 L7 40 L22 16 L14 16 Z", fillOpts);
    ctx.restore();

    // Third bolt — bottom center
    ctx.save();
    ctx.translate(w * 0.5, h * 0.88);
    ctx.scale(0.6, 0.6);
    rc.path("M15 0 L5 20 L12 20 L7 40 L22 16 L14 16 Z", fillOpts);
    ctx.restore();

    // ── Stars ──
    // 5-point star helper
    const drawStar = (cx: number, cy: number, r: number) => {
      const pts: [number, number][] = [];
      for (let i = 0; i < 5; i++) {
        const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2;
        pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
        const innerAngle = angle + Math.PI / 5;
        pts.push([
          cx + r * 0.4 * Math.cos(innerAngle),
          cy + r * 0.4 * Math.sin(innerAngle),
        ]);
      }
      const path =
        pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ") +
        " Z";
      rc.path(path, fillOpts);
    };

    drawStar(w * 0.12, h * 0.4, 12);
    drawStar(w * 0.55, h * 0.05, 14);
    drawStar(w * 0.78, h * 0.58, 10);
    drawStar(w * 0.35, h * 0.68, 11);

    // ── Squiggly underlines ──
    rc.line(w * 0.2, h * 0.52, w * 0.35, h * 0.52, thinOpts);
    rc.line(w * 0.2, h * 0.55, w * 0.33, h * 0.55, {
      ...thinOpts,
      strokeWidth: 1.5,
    });

    rc.line(w * 0.7, h * 0.42, w * 0.82, h * 0.42, thinOpts);
    rc.line(w * 0.72, h * 0.45, w * 0.8, h * 0.45, {
      ...thinOpts,
      strokeWidth: 1.5,
    });

    // ── Dashed ellipses ──
    rc.ellipse(w * 0.65, h * 0.9, 70, 35, {
      ...opts,
      strokeLineDash: [5, 4],
    });
    rc.ellipse(w * 0.18, h * 0.92, 55, 30, {
      ...opts,
      strokeLineDash: [4, 3],
    });

    // ── Cross marks ──
    const drawX = (cx: number, cy: number, s: number) => {
      rc.line(cx - s, cy - s, cx + s, cy + s, opts);
      rc.line(cx + s, cy - s, cx - s, cy + s, opts);
    };
    drawX(w * 0.08, h * 0.65, 8);
    drawX(w * 0.52, h * 0.62, 6);
    drawX(w * 0.9, h * 0.15, 7);

    // ── Curvy wave at bottom ──
    const wavePath = `M${w * 0.3},${h * 0.95} Q${w * 0.35},${h * 0.92} ${w * 0.4},${h * 0.95} Q${w * 0.45},${h * 0.98} ${w * 0.5},${h * 0.95} Q${w * 0.55},${h * 0.92} ${w * 0.6},${h * 0.95}`;
    rc.path(wavePath, thinOpts);
  }, []);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-[21]"
    />
  );
}
