"use client";

import { useEffect, useRef } from "react";
import type { Application } from "@splinetool/runtime";
import type { MagazineIssue } from "../types";

const MAX_SLOTS = 8;

/**
 * Bridges React state (magazineStore) to Spline scene.
 * - Sets Spline Variables (Vol_Label_N, Title_N, Visible_N)
 * - Swaps cover textures via material.layers API
 * - Updates active_book_index variable
 */
export function useSplineBridge(
  app: Application | null,
  issues: MagazineIssue[],
  focusedIndex: number | null
) {
  const prevIssueIdsRef = useRef<string>("");

  // Sync issues → Spline variables + textures
  useEffect(() => {
    if (!app) return;

    const issueIds = issues.map((i) => i.id).join(",");
    if (issueIds === prevIssueIdsRef.current) return;
    prevIssueIdsRef.current = issueIds;

    const slotCount = Math.min(issues.length, MAX_SLOTS);

    for (let i = 0; i < MAX_SLOTS; i++) {
      const idx = i + 1;
      const issue = i < slotCount ? issues[i] : null;

      // Set variables (best-effort, silent fail if not defined in scene)
      trySetVariable(
        app,
        `Vol_Label_${idx}`,
        issue ? `Vol.${String(issue.issue_number).padStart(2, "0")}` : ""
      );
      trySetVariable(app, `Title_${idx}`, issue?.title ?? "");
      trySetVariable(app, `Visible_${idx}`, issue !== null);

      // Cover texture: try setVariable first (Spline's official API)
      // If the scene has a string variable "Cover_Texture_N" bound to a texture, this works directly.
      // Fallback: swap via material.layers API (see tryTextureSwap below).
      if (issue?.cover_image_url) {
        trySetVariable(app, `Cover_Texture_${idx}`, issue.cover_image_url);
        tryTextureSwap(app, `Magazine_${idx}`, issue.cover_image_url);
      }
    }

    trySetVariable(app, "issue_count", slotCount);
    trySetVariable(app, "show_empty_state", slotCount === 0);
  }, [app, issues]);

  // Sync focused index → Spline variable
  useEffect(() => {
    if (!app) return;
    trySetVariable(app, "active_book_index", focusedIndex ?? -1);
  }, [app, focusedIndex]);
}

function trySetVariable(
  app: Application,
  name: string,
  value: string | number | boolean
) {
  try {
    app.setVariable(name, value);
  } catch {
    // Variable not defined in Spline scene — skip silently
  }
}

function tryTextureSwap(
  app: Application,
  objectName: string,
  imageUrl: string
) {
  try {
    const obj = app.findObjectByName(objectName);
    if (!obj) return;

    const mat = (obj as any).material;
    if (!mat?.layers) return;

    const texLayer = mat.layers.find((layer: any) => layer.image !== undefined);
    if (!texLayer) return;

    texLayer.image = { data: imageUrl, name: "cover" };
    app.requestRender();
  } catch {
    // Texture swap failed — skip silently
  }
}
