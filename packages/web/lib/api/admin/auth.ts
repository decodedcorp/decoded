import { createSupabaseServerClient } from "@/lib/supabase/server";
import { checkIsAdmin as dbCheckIsAdmin } from "@/lib/supabase/admin";

/**
 * Route handler용 어드민 인증 래퍼.
 *
 * 세션 유저 + users.is_admin 플래그를 한 번에 확인하고 표준화된 결과를
 * 반환한다. `@/lib/supabase/admin.checkIsAdmin(supabase, userId)`를
 * 내부에서 호출한다.
 *
 * @returns `{ isAdmin: true, userId }` 어드민일 때, 그렇지 않으면 `{ isAdmin: false }`.
 */
export async function checkIsAdmin(): Promise<
  { isAdmin: true; userId: string } | { isAdmin: false; userId?: undefined }
> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isAdmin: false };

  const ok = await dbCheckIsAdmin(supabase, user.id);
  return ok ? { isAdmin: true, userId: user.id } : { isAdmin: false };
}
