"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { MainBItem } from "./types";

/**
 * NeonDoodles — DOM-anchored hand-drawn SVG overlay.
 *
 * Now takes items with center coordinates. Arrows point from each
 * item crop to the exact center position within the post hero image.
 *
 * Elements per item:
 * - Arrow: from item crop edge → post hero image at item.center coordinates
 * - Halo: tilted oval above item crop top-center
 *
 * Global decorations:
 * - Zigzag scratches in empty areas
 * - Short dash marks for energy
 *
 * Techniques:
 * - Multi-layer neon glow (2/5/12/25px blur)
 * - Line boil via animated feTurbulence seed
 * - Per-group easing (arrows slow, halos medium, zags snap)
 * - Seed-fixed randomness for consistent jitter across re-renders
 */

interface NeonDoodlesProps {
  items: MainBItem[];
}

interface ItemRect {
  cx: number;
  cy: number;
  top: number;
  bottom: number;
  left: number;
  right: number;
  w: number;
  h: number;
}

/* Seeded pseudo-random for consistent hand-drawn offsets */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s / 2147483647) * 2 - 1; // -1 to 1
  };
}

/* Generate a hand-drawn bezier curve between two points */
function sketchLine(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  rand: () => number,
  jitter = 8
): string {
  const mx = (x0 + x1) / 2;
  const my = (y0 + y1) / 2;
  const dx = x1 - x0;
  const dy = y1 - y0;
  const nx = -dy * 0.15 + rand() * jitter;
  const ny = dx * 0.15 + rand() * jitter;
  const cx1 = mx + nx + rand() * jitter * 0.5;
  const cy1 = my + ny + rand() * jitter * 0.5;
  return `M ${x0.toFixed(1)} ${y0.toFixed(1)} Q ${cx1.toFixed(1)} ${cy1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
}

/* Generate arrowhead V at end of a curve */
function arrowHead(
  x: number,
  y: number,
  fromX: number,
  fromY: number,
  size = 14
): string {
  const angle = Math.atan2(y - fromY, x - fromX);
  const a1 = angle + Math.PI * 0.8;
  const a2 = angle - Math.PI * 0.8;
  const x1 = x + Math.cos(a1) * size;
  const y1 = y + Math.sin(a1) * size;
  const x2 = x + Math.cos(a2) * size;
  const y2 = y + Math.sin(a2) * size;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} L ${x.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

/* Generate a sketchy open oval (halo) */
function sketchOval(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  rand: () => number,
  tilt = 0
): string {
  const cosT = Math.cos(tilt);
  const sinT = Math.sin(tilt);
  const k = 0.5522847498;
  const j = 1.5;

  const tr = (px: number, py: number): [number, number] => [
    cx + px * cosT - py * sinT + rand() * j,
    cy + px * sinT + py * cosT + rand() * j,
  ];

  const top = tr(0, -ry);
  const right = tr(rx, 0);
  const bottom = tr(0, ry);
  const left = tr(-rx, 0);

  const topRight1 = tr(rx * k + rand() * j, -ry);
  const topRight2 = tr(rx, -ry * k + rand() * j);
  const bottomRight1 = tr(rx, ry * k + rand() * j);
  const bottomRight2 = tr(rx * k + rand() * j, ry);
  const bottomLeft1 = tr(-rx * k + rand() * j, ry);
  const bottomLeft2 = tr(-rx, ry * k + rand() * j);
  const topLeft1 = tr(-rx, -ry * k + rand() * j);

  const f = (p: [number, number]) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;

  return [
    `M ${f(top)}`,
    `C ${f(topRight1)}, ${f(topRight2)}, ${f(right)}`,
    `C ${f(bottomRight1)}, ${f(bottomRight2)}, ${f(bottom)}`,
    `C ${f(bottomLeft1)}, ${f(bottomLeft2)}, ${f(left)}`,
    `C ${f(topLeft1)}, ${f(tr(-rx * k * 0.7, -ry * 0.85))}, ${f(tr(-rx * 0.3, -ry * 0.95))}`,
  ].join(" ");
}

/* Generate a sparkle (4-pointed star burst) */
function sparkle(
  x: number,
  y: number,
  size: number,
  rand: () => number
): string {
  const j = rand() * 1.5;
  return [
    `M ${(x - size + j).toFixed(1)} ${y.toFixed(1)} L ${(x + size).toFixed(1)} ${y.toFixed(1)}`,
    `M ${x.toFixed(1)} ${(y - size + j).toFixed(1)} L ${x.toFixed(1)} ${(y + size).toFixed(1)}`,
    `M ${(x - size * 0.65 + j).toFixed(1)} ${(y - size * 0.65).toFixed(1)} L ${(x + size * 0.65).toFixed(1)} ${(y + size * 0.65).toFixed(1)}`,
    `M ${(x + size * 0.65).toFixed(1)} ${(y - size * 0.65 + j).toFixed(1)} L ${(x - size * 0.65).toFixed(1)} ${(y + size * 0.65).toFixed(1)}`,
  ].join(" ");
}

/* Generate a wavy underline */
function wavyLine(
  x: number,
  y: number,
  width: number,
  rand: () => number
): string {
  const segments = 5;
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 1; i <= segments; i++) {
    const px = x + (i / segments) * width;
    const py = y + (i % 2 === 0 ? -3 : 3) + rand() * 2;
    d += ` L ${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return d;
}

/* Generate a zigzag scratch */
function zigzag(
  x: number,
  y: number,
  len: number,
  segments: number,
  amp: number,
  vertical: boolean,
  rand: () => number
): string {
  let d = `M ${x.toFixed(1)} ${y.toFixed(1)}`;
  for (let i = 1; i <= segments; i++) {
    const progress = i / segments;
    const side = i % 2 === 0 ? -1 : 1;
    const jx = vertical
      ? x + side * amp + rand() * 4
      : x + progress * len + rand() * 3;
    const jy = vertical
      ? y + progress * len + rand() * 3
      : y + side * amp + rand() * 4;
    d += ` L ${jx.toFixed(1)} ${jy.toFixed(1)}`;
  }
  return d;
}

export function NeonDoodles({ items }: NeonDoodlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string>("");

  const computePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const parent = container.parentElement;
    if (!parent) return;

    const parentRect = parent.getBoundingClientRect();
    if (parentRect.width === 0 || parentRect.height === 0) return;

    const scatteredEls =
      parent.querySelectorAll<HTMLElement>(".scattered-item");
    const postEl = parent.querySelector<HTMLElement>(".post-hero-image");
    if (scatteredEls.length === 0 || !postEl) return;

    const W = parentRect.width;
    const H = parentRect.height;
    const aspectRatio = W / H;

    // Post hero image rect (normalized to SVG 1000x1000 viewBox)
    const postDomRect = postEl.getBoundingClientRect();
    const postRect = {
      left: ((postDomRect.left - parentRect.left) / W) * 1000,
      top: ((postDomRect.top - parentRect.top) / H) * 1000,
      w: (postDomRect.width / W) * 1000,
      h: (postDomRect.height / H) * 1000,
    };

    // Calculate visible fraction of the original image inside the 3:4 object-cover container
    // object-cover scales to fill; object-left anchors x=0%, object-position y defaults to center
    const imgEl = postEl.querySelector<HTMLImageElement>("img");
    const natW = imgEl?.naturalWidth || 1;
    const natH = imgEl?.naturalHeight || 1;
    const imageAspect = natW / natH;
    const containerAspect = postDomRect.width / postDomRect.height;

    let visibleXFrac: number;
    let visibleYFrac: number;
    let yOffset: number; // fraction of original image height that's above visible area

    if (imageAspect > containerAspect) {
      // Image wider than container → height-matched, crops right (object-left: x starts at 0)
      visibleXFrac = containerAspect / imageAspect;
      visibleYFrac = 1.0;
      yOffset = 0;
    } else {
      // Image taller/equal → width-matched, crops top/bottom (object-position y=center)
      visibleXFrac = 1.0;
      visibleYFrac = imageAspect / containerAspect;
      yOffset = (1 - visibleYFrac) / 2; // centered vertically
    }

    // Normalize scattered item rects to SVG viewBox
    const rects: ItemRect[] = Array.from(scatteredEls).map((el) => {
      const r = el.getBoundingClientRect();
      const left = ((r.left - parentRect.left) / W) * 1000;
      const top = ((r.top - parentRect.top) / H) * 1000;
      const w = (r.width / W) * 1000;
      const h = (r.height / H) * 1000;
      return {
        cx: left + w / 2,
        cy: top + h / 2,
        top,
        bottom: top + h,
        left,
        right: left + w,
        w,
        h,
      };
    });

    const rand = seededRandom(42);
    const allPaths: string[] = [];
    const delays: number[] = [];
    const classes: string[] = [];
    const textEls: string[] = []; // SVG text elements (brand labels)
    let delayCounter = 0;

    // Store arrow endpoints for sparkles
    const arrowEndpoints: { x: number; y: number }[] = [];
    // Store arrow midpoints + brand for labels
    const arrowMids: { x: number; y: number; brand: string }[] = [];

    // ── Arrows: item crop → post hero image at item.center coordinates ──
    // The hero shows only the LEFT half of the composite image (CSS width:200%),
    // so center.x maps to the full hero width (x already in 0~0.5 range → * 2 to fill)
    rects.forEach((r, i) => {
      if (i >= items.length) return;
      const item = items[i];

      // Target: map item center to visible hero area
      // NOTE: despite the [y,x]→[x,y] swap in queries, data arrives as [y, x]
      // center[0] = y (vertical), center[1] = x (horizontal)
      const centerX = item.center[1];
      const centerY = item.center[0];

      // object-cover + object-left: only visibleXFrac of width shown (from left)
      // object-position y=center: only visibleYFrac of height shown (centered)
      const mappedX = Math.min(centerX / visibleXFrac, 1);
      const mappedY = Math.min(
        Math.max((centerY - yOffset) / visibleYFrac, 0),
        1
      );
      const targetX = postRect.left + mappedX * postRect.w;
      const targetY = postRect.top + mappedY * postRect.h;

      // Start from the corner of the item crop nearest to target
      const corners: [number, number][] = [
        [r.left, r.top],
        [r.right, r.top],
        [r.left, r.bottom],
        [r.right, r.bottom],
      ];
      let startX = r.cx,
        startY = r.cy,
        bestDist = Infinity;
      for (const [cx, cy] of corners) {
        const d = Math.hypot(cx - targetX, cy - targetY);
        if (d < bestDist) {
          startX = cx;
          startY = cy;
          bestDist = d;
        }
      }

      const endX = targetX;
      const endY = targetY;

      // Main arrow line
      allPaths.push(sketchLine(startX, startY, endX, endY, rand, 12));
      classes.push("dd-arrow");
      delays.push(delayCounter * 0.2);

      // Double-stroke ghost
      allPaths.push(
        sketchLine(
          startX + rand() * 3,
          startY + rand() * 3,
          endX + rand() * 3,
          endY + rand() * 3,
          rand,
          10
        )
      );
      classes.push("dd-ghost");
      delays.push(delayCounter * 0.2);

      // Arrowhead (bigger)
      allPaths.push(arrowHead(endX, endY, startX, startY, 16));
      classes.push("dd-arrow");
      delays.push(delayCounter * 0.2);

      // Spark burst at arrow endpoint (starburst shape)
      const bSize = 10 + Math.abs(rand()) * 4;
      for (let s = 0; s < 6; s++) {
        const a = (s / 6) * Math.PI * 2 + rand() * 0.3;
        const sx = endX + Math.cos(a) * bSize;
        const sy = endY + Math.sin(a) * bSize;
        const ex = endX + Math.cos(a) * (bSize * 0.4);
        const ey = endY + Math.sin(a) * (bSize * 0.4);
        allPaths.push(
          `M ${sx.toFixed(1)} ${sy.toFixed(1)} L ${ex.toFixed(1)} ${ey.toFixed(1)}`
        );
        classes.push("dd-scratch");
        delays.push(delayCounter * 0.2 + 0.1);
      }

      // Store for sparkles & labels
      arrowEndpoints.push({ x: endX, y: endY });
      const midX = (startX + endX) / 2 + rand() * 10;
      const midY = (startY + endY) / 2 + rand() * 10;
      arrowMids.push({ x: midX, y: midY, brand: item.brand || "" });

      delayCounter++;
    });

    // ── Halos: ovals wrapping the entire item div border ──
    rects.forEach((r, i) => {
      const hx = r.cx + rand() * 4;
      const hy = r.cy + rand() * 4;
      const rx = r.w * 0.55 + rand() * 3;
      const ry = rx * aspectRatio + rand() * 3;
      const tilt = rand() * 0.2;

      allPaths.push(sketchOval(hx, hy, rx, ry, rand, tilt));
      classes.push("dd-halo");
      delays.push(1.6 + i * 0.15);

      if (i % 2 === 0) {
        allPaths.push(sketchOval(hx + 2, hy - 1, rx + 1, ry + 0.5, rand, tilt));
        classes.push("dd-ghost");
        delays.push(1.6 + i * 0.15);
      }
    });

    // ── Sparkles: 4-pointed stars near item corners (not on hero image) ──
    rects.forEach((r, i) => {
      const size = 8 + Math.abs(rand()) * 5;
      // Place sparkles at outer corners of items (away from hero center)
      const isLeft = r.cx < 500;
      const sx = isLeft ? r.left - 12 + rand() * 6 : r.right + 12 + rand() * 6;
      const sy = r.top - 8 + rand() * 10;
      allPaths.push(sparkle(sx, sy, size, rand));
      classes.push("dd-scratch");
      delays.push(1.0 + i * 0.15);
      // Second sparkle at opposite corner
      if (i % 2 === 0) {
        const sx2 = isLeft ? r.left - 6 + rand() * 5 : r.right + 6 + rand() * 5;
        const sy2 = r.bottom + 4 + rand() * 8;
        allPaths.push(sparkle(sx2, sy2, size * 0.6, rand));
        classes.push("dd-scratch");
        delays.push(1.1 + i * 0.15);
      }
    });

    // ── Underlines: wavy line below each item ──
    rects.forEach((r, i) => {
      const ux = r.left + r.w * 0.1;
      const uy = r.bottom + 6 + rand() * 4;
      const uWidth = r.w * 0.8;
      allPaths.push(wavyLine(ux, uy, uWidth, rand));
      classes.push("dd-scratch");
      delays.push(2.4 + i * 0.1);
      // Double-stroke ghost
      allPaths.push(wavyLine(ux + 1, uy + 2, uWidth, rand));
      classes.push("dd-ghost");
      delays.push(2.4 + i * 0.1);
    });

    // ── Speech bubbles: brand labels in hand-drawn bubbles ──
    const C = "#eafd67";
    rects.forEach((r, i) => {
      if (i >= items.length || !items[i].brand) return;
      const label =
        items[i].brand!.length > 12
          ? items[i].brand!.slice(0, 12)
          : items[i].brand!;
      const tx = r.cx;
      const ty = r.bottom + 28 + rand() * 4;
      const fontSize = 12;
      const tilt = rand() * 3;
      const padX = label.length * 4.5 + 12;
      const padY = 11;

      // Hand-drawn speech bubble: wobbly rect + triangle tail
      const bx = tx - padX;
      const by = ty - padY - 2;
      const bw = padX * 2;
      const bh = padY * 2 + 2;
      const j = () => rand() * 1.5;
      // Wobbly rectangle path
      const bubblePath = [
        `M ${(bx + 3 + j()).toFixed(1)} ${(by + j()).toFixed(1)}`,
        `L ${(bx + bw - 3 + j()).toFixed(1)} ${(by + j()).toFixed(1)}`,
        `Q ${(bx + bw + j()).toFixed(1)} ${(by + j()).toFixed(1)} ${(bx + bw + j()).toFixed(1)} ${(by + 3 + j()).toFixed(1)}`,
        `L ${(bx + bw + j()).toFixed(1)} ${(by + bh - 3 + j()).toFixed(1)}`,
        `Q ${(bx + bw + j()).toFixed(1)} ${(by + bh + j()).toFixed(1)} ${(bx + bw - 3 + j()).toFixed(1)} ${(by + bh + j()).toFixed(1)}`,
        `L ${(bx + 3 + j()).toFixed(1)} ${(by + bh + j()).toFixed(1)}`,
        `Q ${(bx + j()).toFixed(1)} ${(by + bh + j()).toFixed(1)} ${(bx + j()).toFixed(1)} ${(by + bh - 3 + j()).toFixed(1)}`,
        `L ${(bx + j()).toFixed(1)} ${(by + 3 + j()).toFixed(1)}`,
        `Q ${(bx + j()).toFixed(1)} ${(by + j()).toFixed(1)} ${(bx + 3 + j()).toFixed(1)} ${(by + j()).toFixed(1)}`,
      ].join(" ");
      // Triangle tail pointing up toward item
      const tailPath = `M ${(tx - 6 + j()).toFixed(1)} ${by.toFixed(1)} L ${(tx + j()).toFixed(1)} ${(by - 8 + j()).toFixed(1)} L ${(tx + 6 + j()).toFixed(1)} ${by.toFixed(1)}`;

      allPaths.push(bubblePath);
      classes.push("dd-bubble");
      delays.push(2.6 + i * 0.15);
      allPaths.push(tailPath);
      classes.push("dd-bubble");
      delays.push(2.6 + i * 0.15);

      textEls.push(
        `<text x="${tx.toFixed(1)}" y="${(ty + 2).toFixed(1)}" ` +
          `fill="${C}" font-family="'Courier New', monospace" font-size="${fontSize}" ` +
          `font-weight="bold" letter-spacing="2" text-anchor="middle" ` +
          `transform="rotate(${tilt.toFixed(1)} ${tx.toFixed(1)} ${ty.toFixed(1)})" ` +
          `style="animation-delay:${(2.7 + i * 0.15).toFixed(2)}s" class="dd-text">${label}</text>`
      );
    });

    // ── Dotted connections: same-brand items (curved around hero) ──
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (
          items[i].brand &&
          items[j].brand &&
          items[i].brand === items[j].brand &&
          rects[i] &&
          rects[j]
        ) {
          const ri = rects[i];
          const rj = rects[j];
          // Use outer edges of items (away from hero center) as start/end
          const iLeft = ri.cx < 500;
          const jLeft = rj.cx < 500;
          const x0 = iLeft ? ri.left : ri.right;
          const x1 = jLeft ? rj.left : rj.right;
          // Curve outward (away from center) to avoid crossing the hero
          const curveX =
            iLeft && jLeft
              ? Math.min(ri.left, rj.left) - 40
              : !iLeft && !jLeft
                ? Math.max(ri.right, rj.right) + 40
                : 500;
          const midY = (ri.cy + rj.cy) / 2;
          allPaths.push(
            `M ${x0.toFixed(1)} ${ri.cy.toFixed(1)} Q ${curveX.toFixed(1)} ${midY.toFixed(1)} ${x1.toFixed(1)} ${rj.cy.toFixed(1)}`
          );
          classes.push("dd-dotted");
          delays.push(2.8 + i * 0.15);
        }
      }
    }

    // ── Zigzag scratches in empty zones ──
    allPaths.push(zigzag(30, 700, 200, 7, 25, true, rand));
    classes.push("dd-zag");
    delays.push(3.2);
    allPaths.push(zigzag(33, 698, 200, 7, 25, true, rand));
    classes.push("dd-ghost");
    delays.push(3.2);
    allPaths.push(zigzag(450, 15, 110, 5, 18, true, rand));
    classes.push("dd-zag");
    delays.push(3.4);
    allPaths.push(zigzag(955, 350, 160, 6, 20, true, rand));
    classes.push("dd-zag");
    delays.push(3.55);

    // ── Short energy dashes ──
    rects.forEach((r, i) => {
      if (i % 3 !== 1) return;
      const dx = r.right + 8 + rand() * 10;
      const dy = r.top + rand() * 15;
      allPaths.push(
        `M ${dx.toFixed(1)} ${dy.toFixed(1)} L ${(dx + 12 + rand() * 8).toFixed(1)} ${(dy + 10 + rand() * 6).toFixed(1)}`
      );
      classes.push("dd-scratch");
      delays.push(3.8 + i * 0.05);
    });

    // Build SVG elements string
    const svgParts = allPaths.map((d, i) => {
      const cls = classes[i];
      const delay = delays[i];
      const isGhost = cls === "dd-ghost";
      const isDotted = cls === "dd-dotted";
      const isBubble = cls === "dd-bubble";
      const sw = isGhost
        ? 1.2
        : isDotted
          ? 1.5
          : isBubble
            ? 1.8
            : cls === "dd-arrow"
              ? 3
              : cls === "dd-zag"
                ? 2.8
                : cls === "dd-halo"
                  ? 2.2
                  : 2.5;
      const op = isGhost
        ? 0.18
        : isDotted
          ? 0.2
          : isBubble
            ? 0.6
            : cls === "dd-arrow"
              ? 0.6
              : cls === "dd-zag"
                ? 0.4
                : cls === "dd-halo"
                  ? 0.5
                  : 0.4;
      const dashAttr = isDotted ? ` stroke-dasharray="8 6"` : "";
      const animCls = isDotted
        ? "dd-scratch"
        : isBubble
          ? "dd-bubble"
          : isGhost
            ? "dd-ghost"
            : cls;
      return `<path class="${animCls}" d="${d}" fill="none" stroke="${C}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" opacity="${op}"${dashAttr} style="animation-delay:${delay.toFixed(2)}s"/>`;
    });

    // Add text elements
    svgParts.push(...textEls);

    setPaths(svgParts.join("\n"));
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(computePaths, 200);

    const parent = containerRef.current?.parentElement;
    let observer: ResizeObserver | undefined;
    if (parent) {
      observer = new ResizeObserver(() => computePaths());
      observer.observe(parent);
    }

    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [computePaths]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 pointer-events-none z-[5]"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
        aria-hidden="true"
        dangerouslySetInnerHTML={{
          __html: `
        <defs>
          <filter id="dn-full" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="3" seed="42" result="noise">
              <animate attributeName="seed" values="42;87;13;65;42" dur="0.6s" repeatCount="indefinite"/>
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" result="boiled"/>
            <feGaussianBlur in="boiled" stdDeviation="2" result="sharp"/>
            <feGaussianBlur in="boiled" stdDeviation="6" result="mid"/>
            <feGaussianBlur in="boiled" stdDeviation="15" result="soft"/>
            <feMerge>
              <feMergeNode in="soft"/>
              <feMergeNode in="mid"/>
              <feMergeNode in="sharp"/>
              <feMergeNode in="boiled"/>
            </feMerge>
          </filter>
        </defs>
        <style>
          .dd-arrow { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: dn-draw 1.4s cubic-bezier(0.22,0.61,0.36,1) forwards; }
          .dd-bubble { stroke-dasharray: 600; stroke-dashoffset: 600; animation: dn-draw 0.6s cubic-bezier(0.42,0,0.58,1) forwards; }
          .dd-halo { stroke-dasharray: 800; stroke-dashoffset: 800; animation: dn-draw 0.8s cubic-bezier(0.42,0,0.58,1) forwards; }
          .dd-zag { stroke-dasharray: 1000; stroke-dashoffset: 1000; animation: dn-draw 0.5s cubic-bezier(0.55,0.06,0.68,0.19) forwards; }
          .dd-scratch { stroke-dasharray: 200; stroke-dashoffset: 200; animation: dn-draw 0.25s linear forwards; }
          .dd-ghost { stroke-dasharray: 1200; stroke-dashoffset: 1200; animation: dn-draw 1.4s cubic-bezier(0.22,0.61,0.36,1) forwards; }
          .dd-text { opacity: 0; animation: dn-fade 0.6s ease-out forwards; }
          @keyframes dn-draw { to { stroke-dashoffset: 0; } }
          @keyframes dn-fade { to { opacity: 0.35; } }
          @media (prefers-reduced-motion: reduce) {
            .dd-arrow,.dd-halo,.dd-zag,.dd-scratch,.dd-ghost,.dd-bubble,.dd-text { animation: none !important; stroke-dashoffset: 0; opacity: inherit; }
          }
        </style>
        <g filter="url(#dn-full)">
          ${paths}
        </g>
      `,
        }}
      />
    </div>
  );
}
