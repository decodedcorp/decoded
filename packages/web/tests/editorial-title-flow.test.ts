import { describe, test, expect } from "vitest";

/**
 * Tests for editorial title overlay data flow (CARD-02).
 *
 * These tests validate the pure data transformation logic that feeds the
 * ExploreCardCell editorial overlay — no React rendering required.
 *
 * Data flow:
 *   Supabase posts.post_magazine_title
 *     → useImages.ts: title = post.post_magazine_title ?? post.title ?? null
 *     → ExploreClient.tsx: editorialTitle = item.title (when hasMagazine && item.title != null)
 *     → ExploreCardCell.tsx: {item?.editorialTitle && <overlay>}
 */

// ---------------------------------------------------------------------------
// Utility: replicate the useImages.ts title mapping logic
// ---------------------------------------------------------------------------

function mapPostTitle(post: {
  post_magazine_title: string | null | undefined;
  title: string | null | undefined;
}): string | null {
  return post.post_magazine_title ?? post.title ?? null;
}

// ---------------------------------------------------------------------------
// Utility: replicate the ExploreClient.tsx editorialTitle gate logic
// ---------------------------------------------------------------------------

function buildGridItem(
  item: { title: string | null },
  hasMagazine: boolean
): { editorialTitle?: string } {
  return {
    ...(hasMagazine && item.title != null && { editorialTitle: item.title }),
  };
}

// ---------------------------------------------------------------------------
// Tests: useImages.ts title mapping (post_magazine_title priority)
// ---------------------------------------------------------------------------

describe("useImages.ts title mapping (CARD-02)", () => {
  test("post_magazine_title takes priority over post.title", () => {
    const result = mapPostTitle({
      post_magazine_title: "Vogue Korea May 2026",
      title: "Some Post Title",
    });
    expect(result).toBe("Vogue Korea May 2026");
  });

  test("falls back to post.title when post_magazine_title is null", () => {
    const result = mapPostTitle({
      post_magazine_title: null,
      title: "Some Post Title",
    });
    expect(result).toBe("Some Post Title");
  });

  test("returns null when both post_magazine_title and title are null", () => {
    const result = mapPostTitle({
      post_magazine_title: null,
      title: null,
    });
    expect(result).toBeNull();
  });

  test("returns null when both are undefined", () => {
    const result = mapPostTitle({
      post_magazine_title: undefined,
      title: undefined,
    });
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: ExploreClient.tsx editorialTitle gate (hasMagazine && item.title != null)
// ---------------------------------------------------------------------------

describe("ExploreClient.tsx editorialTitle gate (CARD-02)", () => {
  test("editorialTitle is set when hasMagazine=true and title is non-null", () => {
    const gridItem = buildGridItem({ title: "Vogue Korea May 2026" }, true);
    expect(gridItem.editorialTitle).toBe("Vogue Korea May 2026");
  });

  test("editorialTitle is absent when hasMagazine=false (general Explore tab)", () => {
    const gridItem = buildGridItem({ title: "Vogue Korea May 2026" }, false);
    expect(gridItem.editorialTitle).toBeUndefined();
  });

  test("editorialTitle is absent when item.title is null (null guard)", () => {
    const gridItem = buildGridItem({ title: null }, true);
    expect(gridItem.editorialTitle).toBeUndefined();
  });

  test("editorialTitle is set for empty string (allows empty — hasMagazine=true)", () => {
    // item.title != null allows empty strings through (intentional)
    // An empty string would render an empty overlay text — acceptable
    const gridItem = buildGridItem({ title: "" }, true);
    expect(gridItem.editorialTitle).toBe("");
  });
});

// ---------------------------------------------------------------------------
// Tests: end-to-end data flow (post → gridItem)
// ---------------------------------------------------------------------------

describe("Editorial title end-to-end data flow (CARD-02)", () => {
  function fullPipeline(
    post: {
      post_magazine_title: string | null | undefined;
      title: string | null | undefined;
    },
    hasMagazine: boolean
  ): { editorialTitle?: string } {
    const mappedTitle = mapPostTitle(post);
    return buildGridItem({ title: mappedTitle }, hasMagazine);
  }

  test("hasMagazine=true + post with post_magazine_title → editorialTitle set", () => {
    const result = fullPipeline(
      { post_magazine_title: "Harper's Bazaar 2026", title: "Post Title" },
      true
    );
    expect(result.editorialTitle).toBe("Harper's Bazaar 2026");
  });

  test("hasMagazine=true + post without post_magazine_title → falls back to post.title", () => {
    const result = fullPipeline(
      { post_magazine_title: null, title: "Fallback Post Title" },
      true
    );
    expect(result.editorialTitle).toBe("Fallback Post Title");
  });

  test("hasMagazine=true + post with no titles → no editorialTitle (overlay hidden)", () => {
    const result = fullPipeline(
      { post_magazine_title: null, title: null },
      true
    );
    expect(result.editorialTitle).toBeUndefined();
  });

  test("hasMagazine=false + post with post_magazine_title → no editorialTitle (general Explore)", () => {
    const result = fullPipeline(
      { post_magazine_title: "Vogue Korea May 2026", title: "Post Title" },
      false
    );
    expect(result.editorialTitle).toBeUndefined();
  });
});
