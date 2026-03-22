"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { type RequestStep } from "@/lib/stores/requestStore";

interface StepContentProps {
  currentStep: RequestStep;
  children: ReactNode;
}

export function StepContent({ currentStep, children }: StepContentProps) {
  // Track previous step to determine direction
  const prevStepRef = useRef<RequestStep>(currentStep);
  const direction = currentStep > prevStepRef.current ? "forward" : "backward";

  useEffect(() => {
    prevStepRef.current = currentStep;
  }, [currentStep]);

  const variants = {
    enter: (dir: string) => ({
      x: dir === "forward" ? "100%" : "-100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: string) => ({
      x: dir === "forward" ? "-100%" : "100%",
      opacity: 0,
    }),
  };

  return (
    <AnimatePresence mode="wait" custom={direction} initial={false}>
      <motion.div
        key={currentStep}
        custom={direction}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{
          duration: 0.2,
          ease: "easeOut",
        }}
        className="flex-1 min-h-0 flex flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
