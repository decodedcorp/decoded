"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Heading, Text } from "./typography";
import { cn } from "@/lib/utils";

export interface SectionHeaderProps {
  /**
   * Section title
   */
  title: string;
  /**
   * Optional subtitle text
   */
  subtitle?: string;
  /**
   * Optional "VIEW MORE" link
   */
  viewMoreLink?: string;
  /**
   * Custom text for view more link (default: "VIEW MORE")
   */
  viewMoreText?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Enable motion animation (default: true)
   */
  animate?: boolean;
}

/**
 * SectionHeader Component
 *
 * Section header with title, optional subtitle, and optional VIEW MORE link.
 * Features scroll-triggered fade-up animation.
 *
 * @example
 * <SectionHeader title="Trending Now" />
 * <SectionHeader
 *   title="Best of the Week"
 *   subtitle="Curated picks"
 *   viewMoreLink="/explore"
 * />
 */
export function SectionHeader({
  title,
  subtitle,
  viewMoreLink,
  viewMoreText = "VIEW MORE",
  className,
  animate = true,
}: SectionHeaderProps) {
  const content = (
    <div className={cn("flex items-end justify-between mb-6", className)}>
      <div>
        <Heading variant="h2" className="text-xl md:text-2xl">
          {title}
        </Heading>
        {subtitle && (
          <Text variant="small" textColor="muted" className="mt-1">
            {subtitle}
          </Text>
        )}
      </div>
      {viewMoreLink && (
        <Link href={viewMoreLink}>
          <Text
            variant="small"
            textColor="muted"
            as="span"
            className="font-medium hover:text-foreground transition-colors"
          >
            {viewMoreText}
          </Text>
        </Link>
      )}
    </div>
  );

  if (!animate) {
    return content;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {content}
    </motion.div>
  );
}
