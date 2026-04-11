"use client";

import Image from "next/image";
import { Maximize2 } from "lucide-react";
import { AISummarySection } from "./AISummarySection";
import type {
  PostMagazineLayout,
  RelatedEditorialItem,
} from "@/lib/api/mutation-types";

type ImagePreviewProps = {
  imageUrl: string;
  alt?: string;
};

function ImagePreview({ imageUrl, alt = "Post" }: ImagePreviewProps) {
  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-muted md:max-w-sm">
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 384px"
      />
    </div>
  );
}

type Props = {
  image: {
    id: string;
    image_url?: string | null;
    ai_summary?: string | null;
    items?: { length: number } | unknown[];
    postImages?: { post?: { account?: string; account_id?: string } }[];
  };
  magazineTitle?: string | null;
  magazineLayout?: PostMagazineLayout | null;
  relatedEditorials?: RelatedEditorialItem[];
  artistTags?: string[];
  brands?: string[];
  styleTags?: string[];
  onViewFull: () => void;
};

/**
 * Preview for modal drawer.
 * Magazine posts: renders editorial content inline (no GSAP animations).
 * Non-magazine posts: lightweight preview with AI summary.
 */
export function ImageDetailPreview({
  image,
  magazineTitle,
  magazineLayout,
  relatedEditorials,
  artistTags,
  brands,
  styleTags,
  onViewFull,
}: Props) {
  const imageUrl =
    (image as { image_url?: string }).image_url ??
    (image as { postImages?: { post?: { image_url?: string } }[] })
      ?.postImages?.[0]?.post?.image_url;

  const aiSummary = (image as { ai_summary?: string | null }).ai_summary;
  const itemCount = image.items?.length ?? 0;
  const account = (image.postImages?.[0]?.post?.account as string) || "unknown";

  // D-08: Always use brand color — per-post design_spec.accent_color override removed
  const accentColor = "var(--mag-accent)";

  return (
    <div className="flex flex-col gap-6 px-6 py-8 md:px-8 md:py-10">
      {/* Image - mobile only (desktop has floating image) */}
      <div className="block md:hidden">
        {imageUrl && (
          <ImagePreview imageUrl={imageUrl} alt={`Post by @${account}`} />
        )}
      </div>

      {/* Magazine Title Section (no GSAP, always visible) */}
      {magazineLayout ? (
        <section className="text-center space-y-4">
          <p className="typography-overline text-muted-foreground">Editorial</p>
          <h2 className="font-serif text-2xl md:text-3xl font-bold tracking-tight leading-tight">
            {magazineLayout.title}
          </h2>
          {magazineLayout.subtitle && (
            <p className="text-sm font-light leading-relaxed text-muted-foreground">
              {magazineLayout.subtitle}
            </p>
          )}
          <div className="flex items-center justify-center gap-4 pt-2">
            <div className="h-px w-8 bg-border/40" />
            <div className="h-1 w-1 rounded-full bg-border/40" />
            <div className="h-px w-8 bg-border/40" />
          </div>
        </section>
      ) : (
        <div className="space-y-2">
          {magazineTitle && (
            <h2 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight leading-tight">
              {magazineTitle}
            </h2>
          )}
          {itemCount > 0 && (
            <p className="text-sm text-muted-foreground">
              Look featuring {itemCount} item{itemCount === 1 ? "" : "s"}
            </p>
          )}
        </div>
      )}

      {/* Tags */}
      {((artistTags?.length ?? 0) > 0 ||
        (brands?.length ?? 0) > 0 ||
        (styleTags?.length ?? 0) > 0) && (
        <div className="flex flex-wrap gap-2">
          {artistTags?.map((a) => (
            <span
              key={a}
              className="rounded-full border border-border bg-foreground/10 px-2.5 py-1 text-xs font-medium text-foreground"
            >
              {a}
            </span>
          ))}
          {brands?.map((b) => (
            <span
              key={b}
              className="rounded-full border border-border bg-muted/30 px-2.5 py-1 text-xs font-medium text-foreground/80"
            >
              {b}
            </span>
          ))}
          {styleTags?.map((s) => (
            <span
              key={s}
              className="rounded-full border border-border/60 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground"
            >
              #{s}
            </span>
          ))}
        </div>
      )}

      {/* Magazine Editorial (inline, no GSAP) */}
      {magazineLayout?.editorial && (
        <article className="space-y-4">
          {magazineLayout.editorial.paragraphs.map((text, i) => (
            <p
              key={i}
              className={`font-serif text-sm leading-relaxed text-foreground md:text-base ${
                i === 0
                  ? "[&]:first-letter:text-4xl [&]:first-letter:font-serif [&]:first-letter:font-bold [&]:first-letter:mr-2 [&]:first-letter:float-left [&]:first-letter:text-foreground [&]:first-letter:leading-[0.8] [&]:first-letter:mt-1"
                  : ""
              }`}
            >
              {text}
            </p>
          ))}
          {magazineLayout.editorial.pull_quote && (
            <blockquote
              className="relative my-6 py-4 border-l-2 pl-4"
              style={{ borderColor: "var(--mag-accent)" }}
            >
              <p className="font-serif text-base italic text-foreground md:text-lg">
                {magazineLayout.editorial.pull_quote}
              </p>
            </blockquote>
          )}
        </article>
      )}

      {/* Magazine Items (inline, compact) */}
      {magazineLayout?.items && magazineLayout.items.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            The Look — {magazineLayout.items.length} Items
          </h3>
          {magazineLayout.items.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/10 p-3"
            >
              {item.image_url && (
                <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                  <Image
                    src={item.image_url}
                    alt={item.title || `Item ${idx + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </div>
              )}
              <div className="min-w-0 flex-1">
                {item.brand && (
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    {item.brand}
                  </p>
                )}
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title || `Item ${idx + 1}`}
                </p>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Magazine Celeb Section (inline, compact) */}
      {magazineLayout?.celeb_list && magazineLayout.celeb_list.length > 0 && (
        <section className="space-y-3">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Celebrity Style
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {magazineLayout.celeb_list.map((celeb, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/10 p-3"
              >
                {celeb.celeb_image_url && (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-muted">
                    <Image
                      src={celeb.celeb_image_url}
                      alt={celeb.celeb_name}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">
                    {celeb.celeb_name}
                  </p>
                  {celeb.item_brand && (
                    <p className="text-xs text-muted-foreground">
                      {celeb.item_brand} — {celeb.item_name}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* AI Summary (non-magazine posts) */}
      {!magazineLayout && aiSummary && (
        <div className="w-full">
          <AISummarySection summary={aiSummary} isModal />
        </div>
      )}

      {/* CTA */}
      <button
        onClick={onViewFull}
        className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
      >
        <Maximize2 className="h-4 w-4" />
        View full editorial
      </button>
    </div>
  );
}
