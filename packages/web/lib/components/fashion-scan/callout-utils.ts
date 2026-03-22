import type { CSSProperties } from "react";
import type {
  BoxPercent,
  CalloutLayout,
  CalloutSide,
  AnchorPoint,
} from "./types";

/**
 * Auto-determine callout side - only left or right
 * Selects left or right based on box horizontal center position
 */
export function inferCallout(box: BoxPercent): CalloutLayout {
  const cx = box.left + box.width / 2;

  // Simple left/right selection based on horizontal center
  const side: CalloutSide = cx < 50 ? "left" : "right";

  return {
    side,
    align: 0, // Can be used for fine-tuning later
    offset: 8, // Small gap from box edge (px)
    offsetUnit: "px",
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Convert callout layout to CSS positioning styles relative to box
 * Cards are positioned relative to box edges, not scene edges
 */
export function getCalloutPositionStyle(
  box: BoxPercent,
  layout: CalloutLayout
): CSSProperties {
  const { side, offset, offsetUnit = "px" } = layout;

  const cx = box.left + box.width / 2;
  const cy = box.top + box.height / 2;

  // Safe zone to prevent cards from sticking to image corners
  const safeX = clamp(cx, 10, 90);
  const safeY = clamp(cy, 10, 90);

  const gap = offset ?? 8;
  const gapValue = `${gap}${offsetUnit}`;

  if (side === "right") {
    return {
      top: `${safeY}%`,
      left: `calc(${box.left + box.width}% + ${gapValue})`,
      transform: "translateY(-50%)",
    };
  }

  if (side === "left") {
    return {
      top: `${safeY}%`,
      left: `calc(${box.left}% - ${gapValue})`,
      transform: "translate(-100%, -50%)",
    };
  }

  if (side === "top") {
    return {
      left: `${safeX}%`,
      top: `calc(${box.top}% - ${gapValue})`,
      transform: "translate(-50%, -100%)",
    };
  }

  // bottom
  return {
    left: `${safeX}%`,
    top: `calc(${box.top + box.height}% + ${gapValue})`,
    transform: "translate(-50%, 0%)",
  };
}

/**
 * Calculate box edge anchor point relative to scene container
 * Returns the edge point of the box facing the card (based on side)
 */
export function getBoxAnchor(
  boxRect: DOMRect,
  sceneRect: DOMRect,
  side: CalloutSide
): AnchorPoint {
  if (side === "right") {
    return {
      x: boxRect.right - sceneRect.left,
      y: boxRect.top + boxRect.height / 2 - sceneRect.top,
    };
  }

  if (side === "left") {
    return {
      x: boxRect.left - sceneRect.left,
      y: boxRect.top + boxRect.height / 2 - sceneRect.top,
    };
  }

  if (side === "top") {
    return {
      x: boxRect.left + boxRect.width / 2 - sceneRect.left,
      y: boxRect.top - sceneRect.top,
    };
  }

  // bottom
  return {
    x: boxRect.left + boxRect.width / 2 - sceneRect.left,
    y: boxRect.bottom - sceneRect.top,
  };
}

/**
 * Calculate card edge anchor point based on side, relative to scene container
 */
export function getCardAnchor(
  cardRect: DOMRect,
  sceneRect: DOMRect,
  side: CalloutSide
): AnchorPoint {
  if (side === "left") {
    return {
      x: cardRect.right - sceneRect.left,
      y: cardRect.top + cardRect.height / 2 - sceneRect.top,
    };
  }

  if (side === "right") {
    return {
      x: cardRect.left - sceneRect.left,
      y: cardRect.top + cardRect.height / 2 - sceneRect.top,
    };
  }

  if (side === "top") {
    return {
      x: cardRect.left + cardRect.width / 2 - sceneRect.left,
      y: cardRect.bottom - sceneRect.top,
    };
  }

  // bottom
  return {
    x: cardRect.left + cardRect.width / 2 - sceneRect.left,
    y: cardRect.top - sceneRect.top,
  };
}
