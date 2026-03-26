import { PublicProfileClient } from "./PublicProfileClient";

type Props = {
  params: Promise<{ userId: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { userId } = await params;
  return {
    title: `Profile | DECODED`,
    description: `View user profile on DECODED`,
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { userId } = await params;
  return <PublicProfileClient userId={userId} />;
}
