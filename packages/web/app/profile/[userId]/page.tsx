import type { Metadata } from "next";
import { PublicProfileClient } from "./PublicProfileClient";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Props = {
  params: Promise<{ userId: string }>;
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://decoded.style";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { userId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("display_name, bio")
    .eq("id", userId)
    .single();

  const displayName = user?.display_name || "User";
  const title = `${displayName}'s Profile`;
  const description =
    user?.bio || `View ${displayName}'s style collection on Decoded.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/profile/${userId}` },
    openGraph: { title, description },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  return <PublicProfileClient userId={userId} />;
}
