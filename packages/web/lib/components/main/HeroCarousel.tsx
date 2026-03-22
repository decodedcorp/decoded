"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { heroSlides, type HeroSlide } from "@/lib/data/heroSlides";

interface CarouselDotsProps {
  total: number;
  current: number;
  onDotClick: (index: number) => void;
}

function CarouselDots({ total, current, onDotClick }: CarouselDotsProps) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onDotClick(index)}
          className={`h-2 rounded-full transition-all duration-300 ${
            index === current
              ? "w-8 bg-white"
              : "w-2 bg-white/40 hover:bg-white/60"
          }`}
          aria-label={`Go to slide ${index + 1}`}
        />
      ))}
    </div>
  );
}

interface HeroCarouselProps {
  slides?: HeroSlide[];
  autoPlayInterval?: number;
}

export function HeroCarousel({
  slides = heroSlides,
  autoPlayInterval = 5000,
}: HeroCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const goToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
    // Resume autoplay after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  }, []);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying || slides.length <= 1) return;

    const interval = setInterval(nextSlide, autoPlayInterval);
    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, nextSlide, slides.length]);

  const currentSlide = slides[currentIndex];

  return (
    <section className="relative h-screen w-full overflow-hidden bg-main-bg">
      {/* Background Images */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* 1) Blurred background: 같은 이미지로 여백 채움 */}
          {currentSlide.imageUrl ? (
            <div className="absolute inset-0 overflow-hidden">
              <Image
                src={currentSlide.imageUrl}
                alt=""
                fill
                className="object-cover blur-2xl scale-110 opacity-80"
                priority={currentIndex === 0}
                sizes="100vw"
                unoptimized={currentSlide.imageUrl.startsWith("http")}
                aria-hidden
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 via-gray-900 to-black" />
          )}

          {/* 2) 실제 이미지: 비율 유지 (object-contain) */}
          <div className="absolute inset-0 flex items-center justify-center">
            {currentSlide.imageUrl ? (
              <Image
                src={currentSlide.imageUrl}
                alt={currentSlide.title}
                fill
                className="object-contain"
                priority={currentIndex === 0}
                sizes="100vw"
                unoptimized={currentSlide.imageUrl.startsWith("http")}
              />
            ) : null}
          </div>

          {/* 3) 하단 그라데이션 (텍스트 가독) */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
        </motion.div>
      </AnimatePresence>

      {/* Content Overlay */}
      <div className="absolute inset-0 flex flex-col justify-end pb-20 md:pb-32 px-6 md:px-12 lg:px-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
            className="max-w-4xl"
          >
            <h2 className="text-hero font-bold text-white leading-none tracking-tight mb-4">
              {currentSlide.title}
            </h2>
            {currentSlide.subtitle && (
              <p className="text-heading-md font-medium text-white/80 mb-8">
                {currentSlide.subtitle}
              </p>
            )}
            <Link
              href={currentSlide.link}
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-semibold rounded-full hover:bg-white/90 transition-colors"
            >
              살펴보기
              <svg
                className="w-5 h-5"
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
        </AnimatePresence>

        {/* Carousel Dots */}
        <div className="mt-12">
          <CarouselDots
            total={slides.length}
            current={currentIndex}
            onDotClick={goToSlide}
          />
        </div>
      </div>

      {/* Loading indicator */}
      {isAutoPlaying && slides.length > 1 && (
        <div className="absolute bottom-8 left-6 md:left-12 lg:left-20 w-24 h-0.5 bg-white/20 rounded-full overflow-hidden">
          <motion.div
            key={currentIndex}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: autoPlayInterval / 1000, ease: "linear" }}
            className="h-full bg-white"
          />
        </div>
      )}
    </section>
  );
}
