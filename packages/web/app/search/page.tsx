import { redirect } from "next/navigation";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const target = q ? `/explore?q=${encodeURIComponent(q)}` : "/explore";
  redirect(target);
}
