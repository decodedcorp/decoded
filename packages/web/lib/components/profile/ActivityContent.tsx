"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { ActivityTab } from "./ActivityTabs";

interface ActivityContentProps {
  activeTab: ActivityTab;
  children: ReactNode;
  className?: string;
}

export function ActivityContent({
  activeTab,
  children,
  className,
}: ActivityContentProps) {
  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
