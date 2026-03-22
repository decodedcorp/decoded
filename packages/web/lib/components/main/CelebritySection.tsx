"use client";

import { motion } from "motion/react";

interface CelebritySectionProps {
  celebrityName: string;
  subtitle?: string;
}

export function CelebritySection({
  celebrityName,
  subtitle = "아이템 둘러보기",
}: CelebritySectionProps) {
  return (
    <section className="py-16 md:py-24 px-6 md:px-12 lg:px-20 bg-main-bg">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="text-center"
      >
        <h2 className="inline-block">
          <span className="text-heading-xl md:text-hero font-bold text-main-accent">
            {celebrityName}
          </span>
          <span className="text-heading-lg md:text-heading-xl font-bold text-white ml-4">
            {subtitle}
          </span>
        </h2>

        {/* Decorative underline */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
          className="mt-4 h-1 bg-gradient-to-r from-transparent via-main-accent to-transparent max-w-md mx-auto"
        />
      </motion.div>
    </section>
  );
}
