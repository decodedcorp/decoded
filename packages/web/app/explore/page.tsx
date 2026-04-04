import { Suspense } from "react";
import { ExploreClient } from "./ExploreClient";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function ExplorePage({ searchParams }: Props) {
  const { q } = await searchParams;
  return (
    <Suspense>
      <ExploreClient hasMagazine initialQuery={q ?? ""} />
    </Suspense>
  );
}
