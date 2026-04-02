"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { getPost } from "@/lib/api/generated/posts/posts";
import type {
  PostDetailResponse,
  SpotWithTopSolution,
} from "@/lib/api/generated/models";
import type { StyleCardData } from "./StyleCard";
import { cn } from "@/lib/utils";
import { SpotMarker } from "@/lib/design-system";

const POSTS_TO_SHOW = 4;

interface DecodedSolutionsSectionProps {
  styles: StyleCardData[];
}

/** 솔루션 한 건 표시 (데스크톱 리스트용) */
function SolutionItem({
  spot,
  postId,
  postImageUrl,
}: {
  spot: SpotWithTopSolution;
  postId: string;
  postImageUrl: string;
}) {
  const sol = spot.top_solution;
  if (!sol) return null;

  const meta = sol.metadata as
    | { brand?: string; price?: number; currency?: string }
    | undefined;
  const priceStr =
    meta?.price != null
      ? `${meta.currency ?? "KRW"} ${meta.price.toLocaleString()}`
      : null;

  return (
    <Link
      href={`/posts/${postId}?spot=${spot.id}`}
      className="flex gap-3 rounded-xl bg-white/5 p-3 transition hover:bg-white/10"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-neutral-800">
        {sol.thumbnail_url ? (
          <Image
            src={sol.thumbnail_url}
            alt={sol.title}
            fill
            className="object-cover"
            sizes="56px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/40">
            —
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-white">{sol.title}</p>
        {meta?.brand && (
          <p className="truncate text-xs text-white/50">{meta.brand}</p>
        )}
        {priceStr && <p className="mt-0.5 text-xs text-primary">{priceStr}</p>}
      </div>
    </Link>
  );
}

/** 데스크톱: 포스트 한 장 | 스팟별 솔루션 리스트 (교차) */
function DesktopPostSolutionBlock({
  postDetail,
  reverse,
  index,
}: {
  postDetail: PostDetailResponse;
  reverse: boolean;
  index: number;
}) {
  const spotsWithSolution = postDetail.spots.filter(
    (s) => s.top_solution != null
  );
  const artistName =
    postDetail.artist_name || postDetail.group_name || "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8"
    >
      <div className={cn("min-w-0", reverse && "md:order-2")}>
        <Link
          href={`/posts/${postDetail.id}`}
          className="group relative block overflow-hidden rounded-2xl md:rounded-3xl bg-neutral-900 aspect-[3/4]"
        >
          <Image
            src={postDetail.image_url}
            alt={postDetail.title || `${artistName} 스타일`}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <p className="text-primary font-sans text-[10px] font-bold tracking-widest uppercase">
              Decoded
            </p>
            <p className="mt-1 font-serif italic text-white">{artistName}</p>
            <p className="text-sm text-white/70">
              {spotsWithSolution.length} solution
              {spotsWithSolution.length !== 1 ? "s" : ""}
            </p>
          </div>
        </Link>
      </div>
      <div
        className={cn(
          "flex flex-col justify-center gap-3",
          reverse && "md:order-1"
        )}
      >
        {spotsWithSolution.slice(0, 5).map((spot) => (
          <SolutionItem
            key={spot.id}
            spot={spot}
            postId={postDetail.id}
            postImageUrl={postDetail.image_url}
          />
        ))}
      </div>
    </motion.div>
  );
}

/** 모바일: 포스트 카드 + 스팟 탭 시 솔루션 간단 표시 */
function MobilePostWithSpots({
  postDetail,
  index,
}: {
  postDetail: PostDetailResponse;
  index: number;
}) {
  const [activeSpotId, setActiveSpotId] = useState<string | null>(null);
  const activeSpot = postDetail.spots.find((s) => s.id === activeSpotId);
  const artistName =
    postDetail.artist_name || postDetail.group_name || "Unknown";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative"
    >
      <Link
        href={`/posts/${postDetail.id}`}
        className="relative block aspect-[3/4] overflow-hidden rounded-2xl bg-neutral-900"
        onClick={(e) => activeSpotId && e.preventDefault()}
      >
        <Image
          src={postDetail.image_url}
          alt={postDetail.title || `${artistName} 스타일`}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />

        {/* 스팟 마커 – 탭 가능 (공통 SpotMarker) */}
        {postDetail.spots
          .filter((s) => s.top_solution)
          .map((spot, i) => (
            <SpotMarker
              key={spot.id}
              position={{
                position_left: spot.position_left,
                position_top: spot.position_top,
              }}
              index={i + 1}
              size="lg"
              showIndex={false}
              isSelected={activeSpotId === spot.id}
              onClick={(e) => {
                e?.preventDefault();
                e?.stopPropagation();
                setActiveSpotId(activeSpotId === spot.id ? null : spot.id);
              }}
            />
          ))}

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <p className="font-serif italic text-white">{artistName}</p>
          <p className="text-xs text-white/60">
            {postDetail.spots.filter((s) => s.top_solution).length} solutions
          </p>
        </div>
      </Link>

      {/* 스팟 탭 시 솔루션 간단 정보 (카드 아래 표시) */}
      {activeSpot?.top_solution && (
        <div
          className="absolute top-full left-0 right-0 z-20 mt-2 rounded-xl bg-black/95 p-3 shadow-xl"
          role="dialog"
          aria-label="Solution info"
        >
          <div className="flex gap-3">
            {activeSpot.top_solution.thumbnail_url && (
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={activeSpot.top_solution.thumbnail_url}
                  alt={activeSpot.top_solution.title}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white">
                {activeSpot.top_solution.title}
              </p>
              <Link
                href={`/posts/${postDetail.id}?spot=${activeSpot.id}`}
                className="mt-1 inline-block text-xs font-medium text-primary"
              >
                자세히 보기 →
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function DecodedSolutionsSection({
  styles,
}: DecodedSolutionsSectionProps) {
  const [details, setDetails] = useState<PostDetailResponse[]>([]);
  const idsKey = useMemo(
    () =>
      styles
        .slice(0, POSTS_TO_SHOW)
        .map((s) => s.id)
        .join(","),
    [styles]
  );

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.allSettled(ids.map((id) => getPost(id))).then((results) => {
      if (cancelled) return;
      const list = results
        .filter((r) => r.status === "fulfilled")
        .map(
          (r) =>
            (r as PromiseFulfilledResult<unknown>).value as PostDetailResponse
        );
      setDetails(list);
    });
    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  if (styles.length === 0) return null;

  return (
    <section className="relative border-t border-primary/20 bg-[#0c0c0c] py-16 md:py-20 overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-10 md:mb-12"
        >
          <div>
            <p className="text-primary font-sans text-[10px] font-bold tracking-[0.35em] uppercase mb-2">
              Decoded
            </p>
            <h2 className="text-3xl md:text-5xl font-serif font-bold italic tracking-tighter text-white">
              Community Solutions
            </h2>
            <p className="mt-3 text-white/50 font-sans text-base max-w-md">
              스팟별로 커뮤니티가 찾아낸 아이템을 확인하세요.
            </p>
          </div>
          <Link
            href="/feed"
            className="group inline-flex items-center gap-3 text-xs md:text-sm font-sans font-medium text-white/40 hover:text-primary transition-colors"
          >
            <span>VIEW ALL</span>
            <div className="w-8 h-[1px] bg-white/10 group-hover:bg-primary transition-all group-hover:w-12" />
          </Link>
        </motion.header>

        {/* 데스크톱: 포스트 | 솔루션 리스트 교차 (3~4개 블록) */}
        <div className="hidden md:block space-y-16">
          {details.map((post, index) => (
            <DesktopPostSolutionBlock
              key={post.id}
              postDetail={post}
              reverse={index % 2 === 1}
              index={index}
            />
          ))}
        </div>

        {/* 모바일: 포스트 카드 + 스팟 탭 시 솔루션 간단 표시 */}
        <div className="space-y-6 md:hidden">
          {details.map((post, index) => (
            <MobilePostWithSpots
              key={post.id}
              postDetail={post}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
