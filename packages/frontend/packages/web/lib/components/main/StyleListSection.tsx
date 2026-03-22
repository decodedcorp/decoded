"use client";

import { motion } from "motion/react";
import Link from "next/link";
import { StyleCard, type StyleCardData } from "./StyleCard";

interface StyleListSectionProps {
  title: string;
  subtitle?: string;
  styles: StyleCardData[];
  ctaLabel?: string;
  /** 상단 VIEW ALL 링크 대체 텍스트 (예: "디코딩 요청하기") */
  ctaLinkLabel?: string;
  linkHref?: string;
  /** 강조: 카드에 "N개 풀림" 뱃지 표시 (솔루션 있는 포스트 섹션용) */
  emphasizeSolutions?: boolean;
}

export function StyleListSection({
  title,
  subtitle,
  styles,
  ctaLabel,
  ctaLinkLabel,
  linkHref = "/feed",
  emphasizeSolutions = false,
}: StyleListSectionProps) {
  if (styles.length === 0) return null;

  return (
    <section className="py-12 md:py-16 bg-[#0a0a0a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 mb-8 md:mb-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-serif font-bold italic tracking-tighter text-white">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-4 text-white/50 font-sans text-lg max-w-xl">
                {subtitle}
              </p>
            )}
          </motion.div>
          {!ctaLabel && (
            <Link
              href={linkHref}
              className="group flex items-center gap-3 text-xs md:text-sm font-sans font-medium text-white/40 hover:text-white transition-colors"
            >
              <span>{ctaLinkLabel ?? "VIEW ALL"}</span>
              <div className="w-8 h-[1px] bg-white/10 group-hover:bg-primary transition-all group-hover:w-12" />
            </Link>
          )}
        </div>
      </div>

      <div className="relative">
        <motion.div
          className="flex gap-6 overflow-x-auto px-6 md:px-[max(1.5rem,calc((100vw-80rem)/2+3rem))] pb-12 no-scrollbar snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {styles.map((item, index) => (
            <div
              key={item.id}
              className="min-w-[300px] md:min-w-[450px] snap-center flex flex-col gap-4"
            >
              <StyleCard
                data={item}
                variant="medium"
                index={index}
                showSolutionBadge={
                  emphasizeSolutions && (item.spotCount ?? 0) > 0
                }
              />
              {ctaLabel && (
                <Link
                  href={item.link}
                  className="text-primary font-sans text-sm font-medium hover:underline"
                >
                  {ctaLabel}
                </Link>
              )}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
