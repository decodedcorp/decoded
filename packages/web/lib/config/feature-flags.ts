/**
 * Per-component feature flags for image ratio improvement.
 * Set to false to instantly rollback to original object-cover behavior.
 */
export const FEATURE_FLAGS = {
  dynamicImageRatio: {
    FeedCard: true,
    ExploreCardCell: true,
    MasonryGridItem: true,
    PostsGrid: true,
  },
} as const;

export type DynamicImageRatioComponent =
  keyof typeof FEATURE_FLAGS.dynamicImageRatio;
