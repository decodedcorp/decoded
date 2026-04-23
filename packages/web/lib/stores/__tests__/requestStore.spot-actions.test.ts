/**
 * Unit tests for spot-level actions: moveSpot and restoreSpot.
 * Regression coverage for #291.
 */
import { describe, test, expect, beforeEach } from "vitest";
import { useRequestStore, getRequestActions } from "@/lib/stores/requestStore";

describe("requestStore — moveSpot", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  test("updates center coordinates of the matching spot", () => {
    const actions = getRequestActions();
    actions.addSpot(0.1, 0.2);
    const [spot] = useRequestStore.getState().detectedSpots;

    actions.moveSpot(spot.id, 0.7, 0.8);

    const [updated] = useRequestStore.getState().detectedSpots;
    expect(updated.id).toBe(spot.id);
    expect(updated.center).toEqual({ x: 0.7, y: 0.8 });
  });

  test("clamps coordinates to the [0, 1] range", () => {
    const actions = getRequestActions();
    actions.addSpot(0.5, 0.5);
    const [spot] = useRequestStore.getState().detectedSpots;

    actions.moveSpot(spot.id, -0.3, 1.4);

    const [updated] = useRequestStore.getState().detectedSpots;
    expect(updated.center).toEqual({ x: 0, y: 1 });
  });

  test("is a no-op for unknown spot ids", () => {
    const actions = getRequestActions();
    actions.addSpot(0.5, 0.5);
    const before = useRequestStore.getState().detectedSpots;

    actions.moveSpot("does-not-exist", 0.1, 0.1);

    const after = useRequestStore.getState().detectedSpots;
    expect(after).toEqual(before);
  });
});

describe("requestStore — restoreSpot", () => {
  beforeEach(() => {
    useRequestStore.getState().resetRequestFlow();
  });

  test("reinserts spot at original position and re-indexes numbering", () => {
    const actions = getRequestActions();
    actions.addSpot(0.1, 0.1);
    actions.addSpot(0.2, 0.2);
    actions.addSpot(0.3, 0.3);
    const [, middle] = useRequestStore.getState().detectedSpots;
    const middleSnapshot = { ...middle };
    const originalIndex = 1;

    actions.removeSpot(middle.id);
    expect(useRequestStore.getState().detectedSpots).toHaveLength(2);

    actions.restoreSpot(middleSnapshot, originalIndex);

    const spots = useRequestStore.getState().detectedSpots;
    expect(spots).toHaveLength(3);
    expect(spots[originalIndex].id).toBe(middle.id);
    // Reindexing keeps numbering contiguous even though the id of the
    // middle slot matches the pre-removal snapshot.
    expect(spots.map((s) => s.index)).toEqual([1, 2, 3]);
  });

  test("preserves solution data when restoring a deleted spot", () => {
    const actions = getRequestActions();
    actions.addSpot(0.5, 0.5);
    const [spot] = useRequestStore.getState().detectedSpots;
    actions.setSpotSolution(spot.id, {
      title: "Example",
      originalUrl: "https://example.com",
    });
    const withSolution = useRequestStore
      .getState()
      .detectedSpots.find((s) => s.id === spot.id)!;

    actions.removeSpot(spot.id);
    actions.restoreSpot(withSolution);

    const restored = useRequestStore
      .getState()
      .detectedSpots.find((s) => s.id === spot.id);
    expect(restored?.solution?.originalUrl).toBe("https://example.com");
  });

  test("ignores duplicates when the spot id already exists", () => {
    const actions = getRequestActions();
    actions.addSpot(0.5, 0.5);
    const [spot] = useRequestStore.getState().detectedSpots;

    actions.restoreSpot(spot);

    expect(useRequestStore.getState().detectedSpots).toHaveLength(1);
  });
});
