import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Full page route for /images/[id]
 * Redirects to /posts/[id] since image table is deprecated
 */
export default async function ImageDetailRedirect({ params }: Props) {
  const { id } = await params;
  redirect(`/posts/${id}`);
}
