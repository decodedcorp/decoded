"use client";

import type { ConnectorAnchor } from "./types";

interface ConnectorLayerProps {
  anchors: ConnectorAnchor[];
}

export default function ConnectorLayer({ anchors }: ConnectorLayerProps) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 z-10"
      aria-hidden="true"
      role="presentation"
    >
      {anchors.map((anchor) => (
        <line
          key={anchor.itemId}
          className="fs-connector"
          x1={anchor.boxAnchor.x}
          y1={anchor.boxAnchor.y}
          x2={anchor.cardAnchor.x}
          y2={anchor.cardAnchor.y}
          stroke="#d9fc69"
          strokeWidth={1}
          strokeOpacity={0.9}
        />
      ))}
    </svg>
  );
}
