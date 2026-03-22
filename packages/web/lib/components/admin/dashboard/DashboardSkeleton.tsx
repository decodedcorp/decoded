/**
 * DashboardSkeleton — full-page loading state for the admin dashboard.
 *
 * Combines all section skeletons so the page has a consistent placeholder
 * while React Query fetches data on initial load.
 */

import { KPICardsSkeleton } from "./KPICards";
import { TrafficChartSkeleton } from "./TrafficChart";
import { TodaySummarySkeleton } from "./TodaySummary";

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <KPICardsSkeleton />
      <TrafficChartSkeleton />
      <TodaySummarySkeleton />
    </div>
  );
}
