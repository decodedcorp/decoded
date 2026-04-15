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
    .select("display_name, bio, avatar_url, username")
    .eq("id", userId)
    .single();

  const displayName = user?.display_name || user?.username || "User";
  const title = `${displayName} | DECODED`;
  const description = user?.bio || `Explore ${displayName}'s style collection.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/profile/${userId}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/profile/${userId}`,
      type: "profile",
      ...(user?.avatar_url && {
        images: [{ url: user.avatar_url, width: 200, height: 200 }],
      }),
    },
    twitter: {
      card: user?.avatar_url ? "summary" : "summary",
      title,
      description,
      ...(user?.avatar_url && { images: [user.avatar_url] }),
    },
    robots: { index: true, follow: true },
    other: {
      "profile:username": user?.username || "",
    },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: user } = await supabase
    .from("users")
    .select("display_name, username, avatar_url, bio")
    .eq("id", userId)
    .single();

  const displayName = user?.display_name || user?.username || "User";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: displayName,
    url: `${SITE_URL}/profile/${userId}`,
    ...(user?.avatar_url && { image: user.avatar_url }),
    ...(user?.bio && { description: user.bio }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicProfileClient userId={userId} />
    </>
  );
}
