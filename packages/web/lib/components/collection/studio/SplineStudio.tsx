"use client";

import { useEffect } from "react";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";
import { useStudioStore } from "@/lib/stores/studioStore";
import { useMagazineStore } from "@/lib/stores/magazineStore";
import { useSplineRuntime } from "./useSplineRuntime";
import { useSplineBridge } from "./useSplineBridge";
import { StudioHUD } from "../StudioHUD";
import { IssueDetailPanel } from "../IssueDetailPanel";
import { EmptyStudio } from "../EmptyStudio";

// Placeholder path — replace with self-hosted .splinecode once scene is designed in Spline editor
const SCENE_URL = "/spline/decoded-studio.splinecode";

/**
 * Spline 3D studio component.
 * Wraps <Spline> with runtime bridge, store integration, and interaction handlers.
 * Renders overlay siblings: StudioHUD, IssueDetailPanel, EmptyStudio.
 *
 * NOTE: Must be dynamically imported with ssr:false by the consumer (e.g. CollectionClient).
 */
export function SplineStudio() {
  const runtime = useSplineRuntime();

  const {
    setSplineApp,
    setSplineLoaded,
    setCameraState,
    setEntryComplete,
    focusIssue,
    unfocus,
    focusedIssueId,
  } = useStudioStore();

  const collectionIssues = useMagazineStore((s) => s.collectionIssues);

  // Derive focused index for bridge sync
  const focusedIndex =
    focusedIssueId !== null
      ? collectionIssues.findIndex((i) => i.id === focusedIssueId)
      : null;

  // Bridge: sync magazineStore issues -> Spline variables + cover textures
  useSplineBridge(
    runtime.splineRef.current,
    collectionIssues,
    focusedIndex === -1 ? null : focusedIndex
  );

  /** Called when the Spline scene finishes loading */
  function handleLoad(spline: Application) {
    // Capture Application ref via runtime hook
    runtime.onLoad(spline);

    // Sync store with loaded app instance
    setSplineApp(spline);
    setSplineLoaded(true);

    // Pass initial data variables to Spline scene
    runtime.setVar("issue_count", collectionIssues.length);
    runtime.setVar("show_empty_state", collectionIssues.length === 0);

    // Entry animation plays inside Spline; after 2500ms mark browse state
    setTimeout(() => {
      setCameraState("browse");
      setEntryComplete(true);
    }, 2500);

    // Debug: log magazine objects found in scene
    try {
      const allObjects = spline.getAllObjects();
      const magazineObjects = allObjects
        .map((o: unknown) => (o as { name?: string }).name ?? "")
        .filter((n) => n && /magazine/i.test(n));
      if (magazineObjects.length > 0) {
        console.log("[SplineStudio] Magazine objects:", magazineObjects);
      }
    } catch {
      // getAllObjects not critical — scene still usable
    }
  }

  /** Handle click on 3D objects */
  function handleMouseDown(e: { target: { name: string } }) {
    const name = e?.target?.name;

    if (!name) {
      // Click on empty canvas — unfocus if currently focused
      if (focusedIssueId) unfocus();
      return;
    }

    const match = name.match(/Magazine_(\d+)/i);
    if (match) {
      // Magazine_N uses 1-based index in scene naming convention
      const index = parseInt(match[1], 10) - 1;
      const issue = collectionIssues[index];
      if (issue) {
        focusIssue(issue.id);

        // Compute camera focus position per Pitfall 6 pattern (direct position set, no state)
        const book = runtime.findObject(name);
        const camera = runtime.findObject("MainCamera");
        if (book && camera) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (camera as any).position = {
            x: book.position.x,
            y: book.position.y + 0.5,
            z: book.position.z + 1.5,
          };
          runtime.splineRef.current?.requestRender();
        }
      }
    } else if (focusedIssueId) {
      // Clicked non-book object — unfocus
      unfocus();
    }
  }

  /** Handle hover for cursor feedback */
  function handleMouseHover(e: { target: { name: string } }) {
    const name = e?.target?.name;
    document.body.style.cursor =
      name && /Magazine_\d+/i.test(name) ? "pointer" : "default";
  }

  // Escape key -> unfocus
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && focusedIssueId) unfocus();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusedIssueId, unfocus]);

  // Reset cursor on unmount
  useEffect(() => {
    return () => {
      document.body.style.cursor = "default";
    };
  }, []);

  return (
    <div className="relative fixed inset-0 bg-[#050505]">
      {/* 3D Spline canvas */}
      <Spline
        scene={SCENE_URL}
        onLoad={handleLoad}
        onSplineMouseDown={handleMouseDown}
        onSplineMouseHover={handleMouseHover}
        style={{ width: "100%", height: "100%" }}
      />

      {/* 2D HTML overlays — rendered as siblings on top of the canvas */}
      <StudioHUD />
      <IssueDetailPanel />
      <EmptyStudio />
    </div>
  );
}
