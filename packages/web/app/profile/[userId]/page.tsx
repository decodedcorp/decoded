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
  const description =
    user?.bio || `${displayName}의 스타일 컬렉션을 확인하세요.`;

  return {
    title,
    description,
    alternates: { canonical: `${SITE_URL}/profile/${userId}` },
    openGraph: {
      title,
      description,
      ...(user?.avatar_url && {
        images: [{ url: user.avatar_url, width: 200, height: 200 }],
      }),
    },
    robots: { index: true, follow: true },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  return <PublicProfileClient userId={userId} />;
}
