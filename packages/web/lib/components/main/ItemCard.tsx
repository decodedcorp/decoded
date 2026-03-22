"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { Card, CardContent } from "@/lib/design-system";
import { cn } from "@/lib/utils";

export interface ItemCardData {
  id: string;
  brand: string;
  name: string;
  imageUrl?: string;
  link: string;
  relatedStyles?: number;
  badge?: "TOP" | "NEW" | "BEST";
  price?: string;
}

interface ItemCardProps {
  data: ItemCardData;
  index?: number;
}

const badgeStyles = {
  TOP: "bg-primary text-primary-foreground",
  NEW: "bg-blue-500 text-white",
  BEST: "bg-destructive text-destructive-foreground",
} as const;

export function ItemCard({ data, index = 0 }: ItemCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="group"
    >
      <Link href={data.link} className="block">
        <Card
          variant="default"
          size="sm"
          interactive
          className="overflow-hidden"
        >
          {/* Image */}
          <div className="relative aspect-square bg-muted">
            {data.imageUrl ? (
              <Image
                src={data.imageUrl}
                alt={data.name}
                fill
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                className="object-cover"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-muted to-card" />
            )}

            {/* Badge */}
            {data.badge && (
              <div
                className={cn(
                  "absolute top-2 left-2 px-2 py-0.5 rounded text-xs font-bold",
                  badgeStyles[data.badge]
                )}
              >
                {data.badge}
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground mb-0.5">{data.brand}</p>
            <h4 className="text-sm font-medium text-foreground line-clamp-1 mb-1">
              {data.name}
            </h4>
            {data.relatedStyles !== undefined && (
              <p className="text-xs text-muted-foreground">
                관련 스타일 {data.relatedStyles}
              </p>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
