"use client";

import { motion } from "motion/react";
import Link from "next/link";

interface CTASectionProps {
  title?: string;
  buttonText?: string;
  buttonLink?: string;
}

export function CTASection({
  title = "Curious about your favorite celeb's look?",
  buttonText = "Request",
  buttonLink = "/request",
}: CTASectionProps) {
  return (
    <section className="py-20 md:py-32 px-6 md:px-12 lg:px-20 bg-main-cta-bg">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="max-w-4xl mx-auto text-center"
      >
        <h2 className="text-heading-lg md:text-heading-xl font-bold text-white mb-10">
          {title}
        </h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Link
            href={buttonLink}
            className="inline-flex items-center justify-center gap-3 px-12 py-5
                     bg-main-accent text-white text-xl font-bold rounded-full
                     hover:bg-main-accent/90 transition-all duration-300
                     hover:scale-105 active:scale-95"
          >
            {buttonText}
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
