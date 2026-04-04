"use client";

import { CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { fetchSolutionsByUser } from "@/lib/supabase/queries/profile";

interface SolutionItem {
  id: string;
  imageUrl: string;
  itemName: string;
  brand: string;
  price?: string;
  verified: boolean;
}

function formatPrice(amount: number, currency: string): string {
  if (currency === "KRW") {
    return `${amount.toLocaleString()}`;
  }
  if (currency === "USD") {
    return `$${amount.toLocaleString()}`;
  }
  return `${amount.toLocaleString()} ${currency}`;
}

export interface SolutionsListProps {
  userId?: string;
  solutions?: SolutionItem[];
  className?: string;
}

export function SolutionsList({
  userId,
  solutions,
  className,
}: SolutionsListProps) {
  const { data: fetchedSolutions, isLoading } = useQuery({
    queryKey: ["profile", "solutions", userId],
    queryFn: () => fetchSolutionsByUser(userId!),
    enabled: !!userId && !solutions,
    select: (rows) =>
      rows.map((row) => ({
        id: row.id,
        imageUrl: row.thumbnail_url || "",
        itemName: row.title,
        brand: row.description || "",
        price: row.price_amount
          ? formatPrice(row.price_amount, row.price_currency ?? "KRW")
          : undefined,
        verified: row.is_verified,
      })),
  });

  const displaySolutions = solutions ?? fetchedSolutions;

  if (isLoading && !displaySolutions) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!displaySolutions || displaySolutions.length === 0) {
    return (
      <div className="py-12 text-center">
        <CheckCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          No solutions submitted yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {displaySolutions.map((solution) => (
        <div
          key={solution.id}
          className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border hover:bg-accent/50 transition-colors cursor-pointer"
        >
          <div className="h-12 w-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
            <img
              src={solution.imageUrl}
              alt={solution.itemName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-medium truncate">
                {solution.itemName}
              </p>
              {solution.verified && (
                <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              )}
            </div>
            <p className="text-xs text-muted-foreground">{solution.brand}</p>
          </div>
          {solution.price && (
            <span className="text-sm font-medium flex-shrink-0">
              {solution.price}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
